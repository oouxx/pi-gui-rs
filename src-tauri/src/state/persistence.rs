//! State persistence — stores only the active workspace and session IDs.
//! Session lists are ephemeral (rebuilt from `.jsonl` files at runtime).
//! Full translation of `app-store-persistence.ts`.

use std::path::PathBuf;
use serde_json::{json, Value};

fn agent_dir() -> Option<PathBuf> {
    let home = std::env::var("HOME").ok()?;
    Some(PathBuf::from(&home).join(".pi-rs").join("agent"))
}

fn get_state_path() -> Option<PathBuf> {
    let dir = agent_dir()?;
    let _ = std::fs::create_dir_all(&dir);
    Some(dir.join("ui-state.json"))
}

/// Persist only active IDs, not the full session list.
pub fn persist_state(state: &Value) {
    if let Some(path) = get_state_path() {
        let slim = json!({
            "selectedWorkspaceId": state["selectedWorkspaceId"],
            "selectedSessionId": state["selectedSessionId"],
        });
        if let Ok(json) = serde_json::to_string_pretty(&slim) {
            let _ = std::fs::write(&path, &json);
        }
    }
}

/// Return a minimal state skeleton with the last active IDs restored.
pub fn restore_state() -> Value {
    let persisted: Option<Value> = get_state_path()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok());
    match persisted {
        Some(p) => json!({
            "selectedWorkspaceId": p["selectedWorkspaceId"],
            "selectedSessionId": p["selectedSessionId"],
        }),
        None => json!({}),
    }
}
