//! Runtime snapshot builder.

use serde_json::json;
use crate::state::internal::{RuntimeSnapshot, RuntimeSettings};

/// Read settings from the global pi-rs agent directory (~/.pi-rs/agent/).
fn load_default_settings() -> pi_coding_agent::core::settings_manager::Settings {
    let agent_dir = pi_coding_agent::config::get_agent_dir();
    let mgr = pi_coding_agent::core::settings_manager::SettingsManager::create(
        agent_dir.to_string_lossy().as_ref(),
        Some(agent_dir.to_string_lossy().as_ref()),
    );
    mgr.get_global_settings().clone()
}

/// Reads pi-ai model registry + settings + env vars to build the
/// runtime snapshot the frontend needs for model lists.
/// Provider auth status delegated to pi-rs `pi_ai::env_api_keys`.
pub fn build_runtime_snapshot() -> RuntimeSnapshot {
    pi_ai::providers::register_builtins::register_built_in_api_providers();
    use pi_coding_agent::core::model_registry::ModelRegistry;
    use pi_coding_agent::core::provider_display_names::BUILT_IN_PROVIDER_DISPLAY_NAMES;

    let registry = ModelRegistry::new(ModelRegistry::builtin_models_list());
    let settings = load_default_settings();

    let providers = registry.get_providers();
    let mut models = Vec::new();
    let mut provider_list = Vec::new();

    for pid in &providers {
        let has_auth = pi_ai::env_api_keys::get_env_var_name(pid)
            .and_then(|var| std::env::var(var).ok())
            .map(|v| !v.is_empty() && v != "placeholder")
            .unwrap_or(false);

        let name = BUILT_IN_PROVIDER_DISPLAY_NAMES
            .get(pid.as_str())
            .map(|n| n.to_string())
            .unwrap_or_else(|| {
                let mut n = pid.clone();
                if let Some(c) = n.as_mut_str().get_mut(0..1) { c.make_ascii_uppercase(); }
                n
            });

        provider_list.push(json!({"id": pid, "name": name, "hasAuth": has_auth}));

        for m in registry.get_models_for_provider(pid) {
            models.push(json!({
                "providerId": pid,
                "modelId": m.id,
                "providerName": name,
                "label": if m.name.is_empty() { m.id } else { m.name },
                "available": has_auth,
            }));
        }
    }

    RuntimeSnapshot {
        models,
        providers: provider_list,
        skills: vec![],
        commands: vec![],
        settings: RuntimeSettings {
            enabled_model_patterns: vec![],
            default_provider: settings.default_provider,
            default_model_id: settings.default_model,
            default_thinking_level: settings.thinking_level,
        },
    }
}
