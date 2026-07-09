//! Skill CRUD.
//!
//! Delegates to pi-rs `skills::load_skills()` for discovery and parsing.

use serde_json::json;
use pi_coding_agent::core::skills::{self, LoadSkillsOptions};

/// List all skills — merged from global agent dir and workspace dir.
/// Delegates to pi-rs `skills::load_skills()`.
pub fn list_skills(workspace_path: Option<&str>, ws_id: &str) -> Vec<serde_json::Value> {
    let result = skills::load_skills(&LoadSkillsOptions {
        cwd: workspace_path.unwrap_or("").to_string(),
        include_defaults: true,
        ..Default::default()
    });
    result.skills.into_iter().map(|s| {
        json!({
            "name": s.name,
            "filePath": s.file_path,
            "description": s.description,
            "enabled": true,
            "workspaceId": ws_id,
        })
    }).collect()
}

/// Get a single skill by name.
pub fn get_skill(workspace_path: Option<&str>, ws_id: &str, name: &str) -> Option<serde_json::Value> {
    let result = skills::load_skills(&LoadSkillsOptions {
        cwd: workspace_path.unwrap_or("").to_string(),
        include_defaults: true,
        ..Default::default()
    });
    result.skills.into_iter().find(|s| s.name == name).map(|s| {
        json!({
            "name": s.name,
            "filePath": s.file_path,
            "description": s.description,
            "enabled": true,
            "workspaceId": ws_id,
        })
    })
}

/// Delete a skill file.
pub fn delete_skill(workspace_path: Option<&str>, name: &str) -> Result<(), String> {
    use std::path::PathBuf;
    let agent_dir = pi_coding_agent::config::get_agent_dir().join("skills");
    let mut search_dirs = vec![agent_dir];
    if let Some(wp) = workspace_path {
        search_dirs.push(PathBuf::from(wp).join(".pi").join("skills"));
    }
    for dir in &search_dirs {
        for ext in &["yaml", "yml"] {
            let path = dir.join(format!("{name}.{ext}"));
            if path.exists() {
                std::fs::remove_file(&path).map_err(|e| format!("{e}"))?;
                return Ok(());
            }
        }
    }
    Err(format!("skill '{name}' not found"))
}
