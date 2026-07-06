use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;

use pi_agent_core::types::{AgentEvent, AgentMessage};
use pi_coding_agent::core::agent_session::AgentSession;
use pi_coding_agent::core::sdk::{create_agent_session, CreateAgentSessionOptions};

// ── Types ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct FrontendEvent {
    pub event_type: String,
    pub session_id: String,
    pub data: serde_json::Value,
}

// ── App State ─────────────────────────────────────────────────

pub struct AppState {
    pub session: Mutex<Option<AgentSession>>,
    pub session_id: Mutex<Option<String>>,
    pub is_streaming: AtomicBool,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(None),
            session_id: Mutex::new(None),
            is_streaming: AtomicBool::new(false),
        }
    }
}

// ── Agent Event Forwarding ────────────────────────────────────

fn serialize_event(event: &AgentEvent) -> (String, serde_json::Value) {
    match event {
        AgentEvent::AgentStart => ("agent_start".into(), serde_json::json!({})),
        AgentEvent::AgentEnd { messages } => (
            "agent_end".into(),
            serde_json::json!({ "messages": messages }),
        ),
        AgentEvent::TurnStart => ("turn_start".into(), serde_json::json!({})),
        AgentEvent::TurnEnd {
            message,
            tool_results,
        } => (
            "turn_end".into(),
            serde_json::json!({ "message": message, "tool_results": tool_results }),
        ),
        AgentEvent::MessageStart { message } => {
            ("message_start".into(), serde_json::json!({ "message": message }))
        }
        AgentEvent::MessageUpdate {
            assistant_message_event,
            ..
        } => (
            "message_update".into(),
            serde_json::to_value(assistant_message_event).unwrap_or_default(),
        ),
        AgentEvent::MessageEnd { message } => {
            ("message_end".into(), serde_json::json!({ "message": message }))
        }
        AgentEvent::ToolExecutionStart {
            tool_call_id,
            tool_name,
            args,
        } => (
            "tool_execution_start".into(),
            serde_json::json!({ "tool_call_id": tool_call_id, "tool_name": tool_name, "args": args }),
        ),
        AgentEvent::ToolExecutionUpdate {
            tool_call_id,
            tool_name,
            args,
            partial_result,
        } => (
            "tool_execution_update".into(),
            serde_json::json!({
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "args": args,
                "partial_result": partial_result,
            }),
        ),
        AgentEvent::ToolExecutionEnd {
            tool_call_id,
            tool_name,
            result,
            is_error,
        } => (
            "tool_execution_end".into(),
            serde_json::json!({
                "tool_call_id": tool_call_id,
                "tool_name": tool_name,
                "result": result,
                "is_error": is_error,
            }),
        ),
    }
}

fn build_listener(app: AppHandle, sid: String) -> Arc<dyn Fn(AgentEvent, Option<tokio::sync::watch::Receiver<bool>>) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send>> + Send + Sync> {
    Arc::new(move |event: AgentEvent, _signal| {
        let app = app.clone();
        let sid = sid.clone();
        Box::pin(async move {
            let (event_type, data) = serialize_event(&event);
            let _ = app.emit("agent-event", FrontendEvent { event_type, session_id: sid, data });
        })
    })
}

// ── Tauri Commands ────────────────────────────────────────────

#[tauri::command]
async fn create_session(
    app: AppHandle,
    state: State<'_, AppState>,
    cwd: String,
) -> Result<String, String> {
    pi_ai::providers::register_builtins::register_built_in_api_providers();

    let options = CreateAgentSessionOptions {
        cwd,
        agent_dir: None,
        model: None,
        thinking_level: None,
        scoped_models: None,
        no_tools: None,
        tools: None,
        exclude_tools: None,
        custom_prompt: None,
        append_system_prompt: None,
        session_name: None,
        stream_fn: None,
        convert_to_llm: None,
        extension_paths: vec![],
        enable_extensions: false,
    };

    let (mut session, _) = create_agent_session(options)
        .await
        .map_err(|e| format!("Failed to create agent session: {e}"))?;

    let sid = uuid::Uuid::new_v4().to_string();
    *state.session_id.lock().await = Some(sid.clone());

    // Subscribe and forward events to frontend
    session.subscribe(build_listener(app, sid.clone())).await;

    *state.session.lock().await = Some(session);

    Ok(sid)
}

#[tauri::command]
async fn send_message(
    app: AppHandle,
    state: State<'_, AppState>,
    text: String,
) -> Result<(), String> {
    let sid = state.session_id.lock().await.clone().ok_or("No active session")?;

    let mut session = state.session.lock().await.take().ok_or("No active session")?;
    state.is_streaming.store(true, Ordering::SeqCst);
    drop(state); // release the borrow — app.state() will re-acquire

    tokio::spawn(async move {
        // Emit user message event for immediate display
        let _ = app.emit("agent-event", FrontendEvent {
            event_type: "user_message".into(),
            session_id: sid.clone(),
            data: serde_json::json!({
                "text": text,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }),
        });

        // Process — this triggers agent.process() which emits events through the listener
        session.add_user_text(&text).await;

        // Store session back
        let st = app.state::<AppState>();
        *st.session.lock().await = Some(session);
        st.is_streaming.store(false, Ordering::SeqCst);
    });

    Ok(())
}

#[tauri::command]
async fn abort(state: State<'_, AppState>) -> Result<(), String> {
    let guard = state.session.lock().await;
    if let Some(session) = guard.as_ref() {
        session.abort().await;
    }
    state.is_streaming.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn is_streaming(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.is_streaming.load(Ordering::SeqCst))
}

#[tauri::command]
async fn get_messages(state: State<'_, AppState>) -> Result<Vec<AgentMessage>, String> {
    let guard = state.session.lock().await;
    match guard.as_ref() {
        Some(session) => Ok(session.get_messages().await),
        None => Ok(vec![]),
    }
}

// ── App Builder ───────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            create_session,
            send_message,
            abort,
            is_streaming,
            get_messages,
        ])
        .run(tauri::generate_context!())
        .expect("error while running pi-gui-rs");
}
