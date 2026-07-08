//! Skill CRUD — discovers skills from the agent directory and workspace `.pi/skills/`.

use serde_json::json;
use std::path::PathBuf;

/// Directories to scan for skill YAML files.
fn skill_dirs(workspace_path: Option<&str>) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    // Global agent skills
    let agent_dir = pi_coding_agent::config::get_agent_dir();
    dirs.push(agent_dir.join("skills"));
    // Workspace-local skills
    if let Some(wp) = workspace_path {
        dirs.push(PathBuf::from(wp).join(".pi").join("skills"));
    }
    dirs
}

/// Parse a skill YAML file into a JSON value.
fn parse_skill_file(path: &std::path::Path, ws_id: &str) -> Option<serde_json::Value> {
    let content = std::fs::read_to_string(path).ok()?;
    let name = path.file_stem()?.to_string_lossy().to_string();
    // Simple YAML-like parsing for the `pi-skill` header block
    let description = content.lines()
        .find(|l| l.starts_with("# ") || l.starts_with("description:"))
        .and_then(|l| l.split(':').nth(1))
        .map(|s| s.trim().trim_matches('"').to_string())
        .unwrap_or_default();
    let enabled = true; // skills are enabled by default
    Some(json!({
        "name": name,
        "filePath": path.to_string_lossy(),
        "description": description,
        "enabled": enabled,
        "workspaceId": ws_id,
    }))
}

/// List all skills — merged from global agent dir and workspace dir.
pub fn list_skills(workspace_path: Option<&str>, ws_id: &str) -> Vec<serde_json::Value> {
    let mut skills = Vec::new();
    for dir in skill_dirs(workspace_path) {
        let entries = match std::fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(true, |e| e != "yaml" && e != "yml") { continue; }
            if let Some(skill) = parse_skill_file(&path, ws_id) {
                skills.push(skill);
            }
        }
    }
    skills
}

/// Get a single skill by name.
pub fn get_skill(workspace_path: Option<&str>, ws_id: &str, name: &str) -> Option<serde_json::Value> {
    for dir in skill_dirs(workspace_path) {
        for ext in &["yaml", "yml"] {
            let path = dir.join(format!("{name}.{ext}"));
            if path.exists() {
                return parse_skill_file(&path, ws_id);
            }
        }
    }
    None
}

/// Toggle skill enabled/disabled.  Skills are enabled by default; disable by
/// adding a `.disabled` marker or removing the file to a backup location.
pub fn set_skill_enabled(workspace_path: Option<&str>, name: &str, enabled: bool) -> Result<(), String> {
    let dirs = skill_dirs(workspace_path);
    let skill_dir = dirs.first().ok_or("no skill directory")?;
    std::fs::create_dir_all(skill_dir).map_err(|e| format!("{e}"))?;

    let skill_file = skill_dir.join(format!("{name}.yaml"));
    if !skill_file.exists() {
        let yml = skill_dir.join(format!("{name}.yml"));
        if !yml.exists() {
            return Err(format!("skill '{name}' not found"));
        }
    }
    // For now, just return Ok — actual enable/disable is managed by the session
    // which checks the enabled_skills list at runtime.
    Ok(())
}

/// Delete a skill file.
pub fn delete_skill(workspace_path: Option<&str>, name: &str) -> Result<(), String> {
    for dir in skill_dirs(workspace_path) {
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
