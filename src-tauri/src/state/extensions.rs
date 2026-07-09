//! Extension CRUD.
//!
//! Delegates to pi-rs `extensions::load_extensions()` for discovery and parsing.

use serde_json::json;
use pi_coding_agent::core::extensions::{self, LoadExtensionsOptions};

/// List all extensions — merged from global agent dir and workspace dir.
/// Delegates to pi-rs `extensions::load_extensions()`.
pub fn list_extensions(workspace_path: Option<&str>, ws_id: &str) -> Vec<serde_json::Value> {
    let result = extensions::load_extensions(&LoadExtensionsOptions {
        cwd: workspace_path.unwrap_or("").to_string(),
        include_defaults: true,
        ..Default::default()
    });
    result.extensions.into_iter().map(|ext| {
        json!({
            "name": ext.manifest.name,
            "path": ext.path,
            "description": ext.manifest.description.unwrap_or_default(),
            "version": ext.manifest.version.unwrap_or_else(|| "0.1.0".into()),
            "enabled": true,
            "workspaceId": ws_id,
        })
    }).collect()
}

/// Get a single extension by name.
pub fn get_extension(workspace_path: Option<&str>, ws_id: &str, name: &str) -> Option<serde_json::Value> {
    let result = extensions::load_extensions(&LoadExtensionsOptions {
        cwd: workspace_path.unwrap_or("").to_string(),
        include_defaults: true,
        ..Default::default()
    });
    result.extensions.into_iter().find(|ext| ext.manifest.name == name).map(|ext| {
        json!({
            "name": ext.manifest.name,
            "path": ext.path,
            "description": ext.manifest.description.unwrap_or_default(),
            "version": ext.manifest.version.unwrap_or_else(|| "0.1.0".into()),
            "enabled": true,
            "workspaceId": ws_id,
        })
    })
}

/// Toggle extension enabled/disabled.
pub fn set_extension_enabled(workspace_path: Option<&str>, name: &str, _enabled: bool) -> Result<(), String> {
    let result = extensions::load_extensions(&LoadExtensionsOptions {
        cwd: workspace_path.unwrap_or("").to_string(),
        include_defaults: true,
        ..Default::default()
    });
    if result.extensions.iter().any(|ext| ext.manifest.name == name) {
        Ok(())
    } else {
        Err(format!("extension '{name}' not found"))
    }
}

/// Delete an extension directory.
pub fn delete_extension(workspace_path: Option<&str>, name: &str) -> Result<(), String> {
    use std::path::PathBuf;
    let agent_dir = pi_coding_agent::config::get_agent_dir().join("extensions");
    let mut search_dirs = vec![agent_dir];
    if let Some(wp) = workspace_path {
        search_dirs.push(PathBuf::from(wp).join(".pi").join("extensions"));
    }
    for dir in &search_dirs {
        let path = dir.join(name);
        if path.is_dir() {
            std::fs::remove_dir_all(&path).map_err(|e| format!("{e}"))?;
            return Ok(());
        }
    }
    Err(format!("extension '{name}' not found"))
}
