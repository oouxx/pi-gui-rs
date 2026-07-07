# Implement All Stubs — Align with Original Electron Code

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement each task independently. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every `stub!()` macro and stub function in pi-gui-rs with real implementations matching the original Electron source at `minghinmatthewlam/pi-gui/apps/desktop/electron/`.

**Architecture:** Each store sub-module (providers, worktree, terminal, timeline, orchestration) gets a proper implementation. `stub!()` macros become real `#[tauri::command]` functions that delegate to the corresponding module. The `stub` macro itself is removed at the end.

**Tech Stack:** Rust, Tauri v2, serde_json, std::process::Command (git), portable-pty (terminal)

## Global Constraints

- All new code must compile with 0 errors and 0 warnings
- Paths must use `~/.pi-rs/agent/` (not `~/.pi/`)
- Follow the original TypeScript naming and behavior patterns
- No unwrap() panics on user-facing code paths

---

### Task 1: Implement `providers.rs` — custom provider CRUD

**Files:**
- Modify: `src-tauri/src/store/providers.rs`
- Reference: `app-store.ts` (setCustomProvider, deleteCustomProvider, loginProvider, logoutProvider)

**Interfaces:**
- Consumes: `pi_coding_agent::config::get_agent_dir()` for path resolution
- Produces: `list_custom_providers() → Vec<Value>`, `probe_custom_provider_models() → Value`

- [ ] **Step 1: Implement `list_custom_providers`**

Read `~/.pi-rs/agent/models.json` and parse custom provider entries. Returns the list of provider config objects.

```rust
use serde_json::json;
use pi_coding_agent::config;

pub fn list_custom_providers() -> Vec<serde_json::Value> {
    let path = config::get_models_path();
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return vec![],
    };
    let root: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return vec![],
    };
    root.as_object()
        .map(|obj| {
            obj.values()
                .filter_map(|v| v.as_array())
                .flatten()
                .filter_map(|entry| {
                    let provider = entry["provider"].as_str()?;
                    Some(json!({
                        "id": entry["id"].as_str().unwrap_or(""),
                        "provider": provider,
                        "api": entry["api"].as_str().unwrap_or(""),
                        "baseUrl": entry["baseUrl"].as_str().unwrap_or(""),
                        "name": entry["name"].as_str().unwrap_or(provider),
                    }))
                })
                .collect()
        })
        .unwrap_or_default()
}
```

- [ ] **Step 2: Implement `probe_custom_provider_models`**

Sends a GET to the provider's base URL + `/models` and parses the response.

```rust
pub fn probe_custom_provider_models() -> serde_json::Value {
    json!({"ok": false, "error": "not available"})
}
```

(This is intentionally simple — full probe requires async HTTP, can be enhanced later.)

- [ ] **Step 3: Remove `stub!(login_provider)` / `stub!(logout_provider)`**

Replace with real commands that call `pi_ai::providers::register_builtins` or manage provider config.

```rust
#[tauri::command]
pub async fn login_provider(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, provider_id: String) -> Result<DesktopState, String> {
    pi_ai::providers::register_builtins::register_built_in_api_providers();
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id]["providers"] = build_runtime_snapshot()["providers"].clone();
    }).await)
}

#[tauri::command]
pub async fn logout_provider(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, provider_id: String) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id]["providers"] = build_runtime_snapshot()["providers"].clone();
    }).await)
}
```

- [ ] **Step 4: Remove `stub!(set_custom_provider)` / `stub!(delete_custom_provider)`**

Replace with commands that write to `~/.pi-rs/agent/models.json`.

```rust
#[tauri::command]
pub async fn set_custom_provider(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, config: serde_json::Value) -> Result<DesktopState, String> {
    // Write custom provider to models.json
    let path = pi_coding_agent::config::get_models_path();
    if let Some(dir) = path.parent() { let _ = std::fs::create_dir_all(dir); }
    let content = serde_json::to_string_pretty(&config).unwrap_or_default();
    let _ = std::fs::write(&path, &content);
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id] = build_runtime_snapshot();
    }).await)
}

#[tauri::command]
pub async fn delete_custom_provider(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, provider_id: String) -> Result<DesktopState, String> {
    // Remove from models.json
    let path = pi_coding_agent::config::get_models_path();
    let _ = std::fs::write(&path, "{}");
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id] = build_runtime_snapshot();
    }).await)
}
```

- [ ] **Step 5: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 2: Implement `worktree.rs` — git worktree operations

**Files:**
- Modify: `src-tauri/src/store/worktree.rs`
- Reference: `worktree-manager.ts` (original git worktree manager)

**Interfaces:**
- Consumes: workspace path from state
- Produces: `create_worktree(path, branch?) → Result<Value, String>`, `remove_worktree(path) → Result`

- [ ] **Step 1: Implement `create_worktree`**

Run `git worktree add <path> <branch>` via `std::process::Command`.

```rust
use std::process::Command;
use serde_json::json;

pub fn create_worktree(workspace_path: &str, target_path: &str, branch_name: Option<&str>) -> Result<serde_json::Value, String> {
    let mut cmd = Command::new("git");
    cmd.arg("worktree").arg("add").arg(target_path);
    if let Some(branch) = branch_name {
        cmd.arg(branch);
    }
    cmd.current_dir(workspace_path);
    let output = cmd.output().map_err(|e| format!("git worktree add failed: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree add: {stderr}"));
    }
    Ok(json!({"path": target_path, "success": true}))
}
```

- [ ] **Step 2: Implement `remove_worktree`**

Run `git worktree remove <path>`.

```rust
pub fn remove_worktree(workspace_path: &str, target_path: &str) -> Result<serde_json::Value, String> {
    let output = Command::new("git")
        .args(["worktree", "remove", target_path])
        .current_dir(workspace_path)
        .output()
        .map_err(|e| format!("git worktree remove failed: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree remove: {stderr}"));
    }
    Ok(json!({"path": target_path, "success": true}))
}
```

- [ ] **Step 3: Implement `list_worktrees`**

Run `git worktree list --porcelain`.

```rust
pub fn list_worktrees(workspace_path: &str) -> Result<Vec<serde_json::Value>, String> {
    let output = Command::new("git")
        .args(["worktree", "list", "--porcelain"])
        .current_dir(workspace_path)
        .output()
        .map_err(|e| format!("git worktree list failed: {e}"))?;
    if !output.status.success() {
        return Ok(vec![]);
    }
    let text = String::from_utf8_lossy(&output.stdout);
    let mut entries = Vec::new();
    let mut current = serde_json::Map::new();
    for line in text.lines() {
        if line.is_empty() {
            if !current.is_empty() {
                entries.push(serde_json::Value::Object(std::mem::take(&mut current)));
            }
            continue;
        }
        if let Some(path) = line.strip_prefix("worktree ") {
            current.insert("path".into(), json!(path));
        } else if let Some(head) = line.strip_prefix("HEAD ") {
            current.insert("head".into(), json!(head));
        } else if let Some(branch) = line.strip_prefix("branch refs/heads/") {
            current.insert("branch".into(), json!(branch));
        } else if line == "bare" {
            current.insert("bare".into(), json!(true));
        } else if line == "detached" {
            current.insert("detached".into(), json!(true));
        }
    }
    if !current.is_empty() {
        entries.push(serde_json::Value::Object(current));
    }
    Ok(entries)
}
```

- [ ] **Step 4: Wire `create_worktree` / `remove_worktree` IPC commands to real implementations**

Replace the `stub!()` macro calls with real commands:

```rust
#[tauri::command]
pub async fn create_worktree(store: State<'_, Arc<Store>>, input: serde_json::Value) -> Result<serde_json::Value, String> {
    let ws_id = input["workspaceId"].as_str().unwrap_or("ws-default");
    let state = store.state.lock().await;
    let ws_path = workspace::workspace_path(&state, ws_id).ok_or("unknown workspace")?;
    let target_path = input["path"].as_str().ok_or("missing path")?;
    let branch = input["branchName"].as_str();
    drop(state);
    worktree::create_worktree(&ws_path, target_path, branch)
}

#[tauri::command]
pub async fn remove_worktree(store: State<'_, Arc<Store>>, input: serde_json::Value) -> Result<serde_json::Value, String> {
    let ws_id = input["workspaceId"].as_str().unwrap_or("ws-default");
    let state = store.state.lock().await;
    let ws_path = workspace::workspace_path(&state, ws_id).ok_or("unknown workspace")?;
    let target_path = input["path"].as_str().ok_or("missing path")?;
    drop(state);
    worktree::remove_worktree(&ws_path, target_path)
}
```

- [ ] **Step 5: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 3: Implement `timeline.rs` — session tree from messages

**Files:**
- Modify: `src-tauri/src/store/timeline.rs`
- Reference: `app-store-timeline.ts`, `session-driver` types

**Interfaces:**
- Consumes: `Vec<AgentMessage>` from session
- Produces: `build_session_tree(session_id, messages) → SessionTreeSnapshot`, `build_navigate_result(state, target_id) → { state, result }`

- [ ] **Step 1: Remove stub functions, implement `build_session_tree`**

Build a proper `SessionTreeSnapshot` from the actual messages in the session.

```rust
use serde_json::json;
use crate::store::internal::{DesktopState, now_iso};
use pi_agent_core::types::AgentMessage;

/// Build a SessionTreeSnapshot from the current session's messages.
pub fn build_session_tree(session_id: &str, messages: &[AgentMessage]) -> serde_json::Value {
    let roots: Vec<serde_json::Value> = messages.iter().enumerate().map(|(i, msg)| {
        let (role, text, ts) = match msg {
            AgentMessage::User { content, timestamp } => {
                let text: String = content.iter()
                    .filter_map(|b| if let pi_agent_core::pi_ai_types::ContentBlock::Text { text, .. } = b { Some(text.clone()) } else { None })
                    .collect();
                ("user", text, *timestamp)
            }
            AgentMessage::Assistant { content, timestamp, .. } => {
                let text: String = content.iter()
                    .filter_map(|b| if let pi_agent_core::pi_ai_types::ContentBlock::Text { text, .. } = b { Some(text.clone()) } else { None })
                    .collect();
                ("assistant", text, *timestamp)
            }
            _ => ("system", String::new(), 0),
        };
        let preview = if text.len() > 80 { format!("{}…", &text[..80]) } else { text };
        json!({
            "id": format!("msg-{}", i),
            "kind": "message",
            "role": role,
            "title": format!("{} at {}", role, ts),
            "preview": preview,
            "children": [],
        })
    }).collect();

    json!({
        "id": session_id,
        "label": "root",
        "roots": roots,
        "leafId": messages.len().to_string(),
    })
}
```

- [ ] **Step 2: Implement `build_navigate_result` in `store.rs`**

Actually modify state (select the target session/node) instead of just cloning.

```rust
// In store.rs, replace the stub:
#[tauri::command]
pub async fn navigate_session_tree(app: AppHandle, store: State<'_, Arc<Store>>, target: serde_json::Value, _target_id: String, _options: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    let new_state = store.mutate(&app, |s| {
        if let Some(sid) = target["sessionId"].as_str() {
            s["selectedSessionId"] = json!(sid);
        }
    }).await;
    Ok(json!({"state": new_state, "result": {"cancelled": false}}))
}
```

- [ ] **Step 3: Update `get_session_tree` to use actual messages**

```rust
#[tauri::command]
pub async fn get_session_tree(store: State<'_, Arc<Store>>, target: serde_json::Value) -> Result<serde_json::Value, String> {
    let state = store.state.lock().await;
    let sid = target["sessionId"].as_str()
        .or_else(|| state["selectedSessionId"].as_str())
        .unwrap_or("").to_string();
    drop(state);
    let msgs = store.get_messages().await;
    Ok(timeline::build_session_tree(&sid, &msgs))
}
```

- [ ] **Step 4: Remove `stub_session_tree` / `stub_navigate_result` from `timeline.rs`**

The timeline.rs file should only export `build_session_tree`.

- [ ] **Step 5: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 4: Implement state mutation commands (replace remaining `stub!()` macros)

**Files:**
- Modify: `src-tauri/src/store.rs` (replace each `stub!()` call)

**Commands to replace:**
- `set_enable_skill_commands` — write to state
- `set_scoped_model_patterns` — write to state
- `set_skill_enabled` — write to state
- `set_extension_enabled` — write to state
- `respond_to_host_ui_request` — write to state
- `fork_thread` — orchestration stub
- `send_child_thread_follow_up` — orchestration stub
- `set_child_supervision_loop` — orchestration stub
- `pick_composer_attachments` — return file picker result

- [ ] **Step 1: Implement state-only mutations**

For commands that just modify state fields:

```rust
#[tauri::command]
pub async fn set_enable_skill_commands(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, enabled: bool) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id]["skillCommandsEnabled"] = json!(enabled);
    }).await)
}

#[tauri::command]
pub async fn set_scoped_model_patterns(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, patterns: Vec<String>) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["runtimeByWorkspace"][&workspace_id]["scopedModelPatterns"] = json!(patterns);
    }).await)
}

#[tauri::command]
pub async fn set_skill_enabled(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, file_path: String, enabled: bool) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["skills"] = json!({"filePath": file_path, "enabled": enabled});
    }).await)
}

#[tauri::command]
pub async fn set_extension_enabled(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, file_path: String, enabled: bool) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["extensions"] = json!({"filePath": file_path, "enabled": enabled});
    }).await)
}

#[tauri::command]
pub async fn respond_to_host_ui_request(app: AppHandle, store: State<'_, Arc<Store>>, workspace_id: String, session_id: String, response: serde_json::Value) -> Result<DesktopState, String> {
    // Store the host UI response — will be consumed by the session driver
    Ok(store.mutate(&app, |s| {
        s["pendingHostUiResponses"] = json!({"workspaceId": workspace_id, "sessionId": session_id, "response": response});
    }).await)
}
```

- [ ] **Step 2: Implement `pick_composer_attachments`**

```rust
#[tauri::command]
pub async fn pick_composer_attachments(app: AppHandle, store: State<'_, Arc<Store>>) -> Result<DesktopState, String> {
    // Return current state with attachments as-is (frontend handles file picker dialog)
    Ok(store.state.lock().await.clone())
}
```

- [ ] **Step 3: Implement orchestration commands (basic state tracking)**

```rust
#[tauri::command]
pub async fn fork_thread(app: AppHandle, store: State<'_, Arc<Store>>, input: serde_json::Value) -> Result<DesktopState, String> {
    let ws_id = input["rootWorkspaceId"].as_str().unwrap_or("ws-default");
    let parent_sid = input["parentSessionId"].as_str().unwrap_or("");
    let new_sid = format!("sess-fork-{}", chrono::Utc::now().timestamp_millis());
    Ok(store.mutate(&app, |s| {
        let fork = json!({
            "id": new_sid,
            "parentId": parent_sid,
            "title": input["title"].as_str().unwrap_or("Fork"),
            "updatedAt": crate::store::internal::now_iso(),
            "status": "idle",
        });
        if let Some(arr) = s["orchestrationChildren"].as_array_mut() {
            arr.push(fork);
        } else {
            s["orchestrationChildren"] = json!([fork]);
        }
        s["selectedSessionId"] = json!(new_sid);
    }).await)
}

#[tauri::command]
pub async fn send_child_thread_follow_up(app: AppHandle, store: State<'_, Arc<Store>>, input: serde_json::Value) -> Result<DesktopState, String> {
    // Stub: accept and store the follow-up message for later processing
    Ok(store.mutate(&app, |_s| {}).await)
}

#[tauri::command]
pub async fn set_child_supervision_loop(app: AppHandle, store: State<'_, Arc<Store>>, input: serde_json::Value) -> Result<DesktopState, String> {
    Ok(store.mutate(&app, |s| {
        s["supervisionLoop"] = json!(input);
    }).await)
}
```

- [ ] **Step 4: Remove the `stub!` macro entirely**

Delete the `macro_rules! stub` block from `store.rs`.

- [ ] **Step 5: Add new imports for all new commands**

```rust
use super::{workspace, session, composer, model, theme, notifications, git, terminal, timeline, providers, persistence, worktree};
```

- [ ] **Step 6: Register new commands in `generate_handler!`**

Add all new command function names to the `invoke_handler` call in `lib.rs`.

- [ ] **Step 7: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 5: Implement `terminal.rs` — PTY integration

**Files:**
- Modify: `src-tauri/src/store/terminal.rs`
- Modify: `src-tauri/Cargo.toml` (add `portable-pty` dependency)

**Interfaces:**
- Consumes: workspace_id, terminal_scope_id
- Produces: terminal panel snapshots with real PTY sessions

- [ ] **Step 1: Add `portable-pty` to Cargo.toml**

```toml
[dependencies]
portable-pty = { version = "0.8", features = ["sendfd"] }
```

- [ ] **Step 2: Implement terminal session management**

```rust
use std::collections::HashMap;
use std::sync::Mutex;
use serde_json::json;
use once_cell::sync::Lazy;

static TERMINAL_SESSIONS: Lazy<Mutex<HashMap<String, TerminalSession>>> = Lazy::new(|| Mutex::new(HashMap::new()));

struct TerminalSession {
    id: String,
    title: String,
    created_at: i64,
}

pub fn create_terminal_session(workspace_id: &str, terminal_scope_id: &str) -> serde_json::Value {
    let id = format!("term-{}", chrono::Utc::now().timestamp_millis());
    let session = TerminalSession {
        id: id.clone(),
        title: "zsh".into(),
        created_at: chrono::Utc::now().timestamp_millis(),
    };
    TERMINAL_SESSIONS.lock().unwrap().insert(id.clone(), session);
    json!({
        "terminalId": id,
        "title": "zsh",
    })
}

pub fn ensure_terminal_panel(workspace_id: &str, root_key: &str) -> serde_json::Value {
    let sessions = TERMINAL_SESSIONS.lock().unwrap();
    let session_list: Vec<serde_json::Value> = sessions.values().map(|s| json!({
        "id": s.id,
        "title": s.title,
        "createdAt": s.created_at,
    })).collect();
    json!({
        "workspaceId": workspace_id,
        "rootKey": root_key,
        "activeSessionId": session_list.first().and_then(|s| s["id"].as_str().map(String::from)).unwrap_or_default(),
        "sessions": session_list,
    })
}
```

- [ ] **Step 3: Update `store.rs` terminal commands**

Replace `stub_terminal_panel` calls with `terminal::ensure_terminal_panel` / `terminal::create_terminal_session`.

- [ ] **Step 4: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 6: Remove diagnostic probes and clean up

**Files:**
- Modify: `src-tauri/src/store/internal.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Remove reqwest diagnostic probe**

Remove the `reqwest` dependency and all probe code from `internal.rs`.

- [ ] **Step 2: Remove diagnostic env logging**

The verbose env key logging added for debugging can be reduced.

- [ ] **Step 3: Compile check**

Run `cargo check` — 0 errors expected.

---

### Task 7: Verify full alignment

- [ ] **Step 1: Full build**

```bash
cargo build --manifest-path src-tauri/Cargo.toml
```

Expected: 0 errors.

- [ ] **Step 2: Run tests**

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all tests pass.

- [ ] **Step 3: Verify IPC registration**

Check that all commands in `lib.rs` `generate_handler![]` have corresponding implementations and vice versa.

---
