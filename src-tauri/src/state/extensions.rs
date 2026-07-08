//! Extension CRUD — discovers extensions from the agent directory and workspace `.pi/extensions/`.

use serde_json::json;
use std::path::PathBuf;

/// Directories to scan for extension directories (each subdir is an extension).
fn extension_dirs(workspace_path: Option<&str>) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    // Global agent extensions
    let agent_dir = pi_coding_agent::config::get_agent_dir();
    dirs.push(agent_dir.join("extensions"));
    // Workspace-local extensions
    if let Some(wp) = workspace_path {
        dirs.push(PathBuf::from(wp).join(".pi").join("extensions"));
    }
    dirs
}

/// Parse an extension directory into a JSON value.
fn parse_extension_dir(path: &std::path::Path, ws_id: &str) -> Option<serde_json::Value> {
    let name = path.file_name()?.to_string_lossy().to_string();
    let manifest_path = path.join("pi-extension.yaml");
    let manifest_content = std::fs::read_to_string(&manifest_path).ok().unwrap_or_default();
    let description = manifest_content.lines()
        .find(|l| l.starts_with("description:"))
        .and_then(|l| l.split(':').nth(1))
        .map(|s| s.trim().trim_matches('"').to_string())
        .unwrap_or_default();
    let version = manifest_content.lines()
        .find(|l| l.starts_with("version:"))
        .and_then(|l| l.split(':').nth(1))
        .map(|s| s.trim().trim_matches('"').to_string())
        .unwrap_or_else(|| "0.1.0".into());
    Some(json!({
        "name": name,
        "path": path.to_string_lossy(),
        "description": description,
        "version": version,
        "enabled": true,
        "workspaceId": ws_id,
    }))
}

/// List all extensions — merged from global agent dir and workspace dir.
pub fn list_extensions(workspace_path: Option<&str>, ws_id: &str) -> Vec<serde_json::Value> {
    let mut extensions = Vec::new();
    for dir in extension_dirs(workspace_path) {
        let entries = match std::fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() { continue; }
            // Skip hidden dirs
            if path.file_name().map_or(true, |n| n.to_string_lossy().starts_with('.')) { continue; }
            if let Some(ext) = parse_extension_dir(&path, ws_id) {
                extensions.push(ext);
            }
        }
    }
    extensions
}

/// Get a single extension by name.
pub fn get_extension(workspace_path: Option<&str>, ws_id: &str, name: &str) -> Option<serde_json::Value> {
    for dir in extension_dirs(workspace_path) {
        let path = dir.join(name);
        if path.is_dir() {
            return parse_extension_dir(&path, ws_id);
        }
    }
    None
}

/// Toggle extension enabled/disabled.
pub fn set_extension_enabled(workspace_path: Option<&str>, name: &str, _enabled: bool) -> Result<(), String> {
    // Extensions are enabled by presence in the directory.
    // The session driver reads enabled_extensions at runtime.
    // Here we just validate the extension exists.
    for dir in extension_dirs(workspace_path) {
        if dir.join(name).is_dir() {
            return Ok(());
        }
    }
    Err(format!("extension '{name}' not found"))
}

/// Delete an extension directory.
pub fn delete_extension(workspace_path: Option<&str>, name: &str) -> Result<(), String> {
    for dir in extension_dirs(workspace_path) {
        let path = dir.join(name);
        if path.is_dir() {
            std::fs::remove_dir_all(&path).map_err(|e| format!("{e}"))?;
            return Ok(());
        }
    }
    Err(format!("extension '{name}' not found"))
}
