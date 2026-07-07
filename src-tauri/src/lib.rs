mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(store::Store::new_with_runtime())
        .invoke_handler(tauri::generate_handler![
            // Core
            store::cmds::ping,
            store::cmds::get_state,
            // Agent session
            store::cmds::create_agent_session_cmd,
            store::cmds::send_message_cmd,
            store::cmds::abort_cmd,
            store::cmds::is_streaming_cmd,
            store::cmds::get_messages_cmd,
            // Workspace
            store::cmds::add_workspace_path,
            store::cmds::pick_workspace,
            store::cmds::select_workspace,
            store::cmds::rename_workspace,
            store::cmds::remove_workspace,
            store::cmds::reorder_workspaces,
            store::cmds::reorder_pinned_sessions,
            store::cmds::open_workspace_in_finder,
            store::cmds::create_worktree,
            store::cmds::remove_worktree,
            store::cmds::open_skill_in_finder,
            store::cmds::open_extension_in_finder,
            store::cmds::sync_current_workspace,
            // Session
            store::cmds::select_session,
            store::cmds::archive_session,
            store::cmds::unarchive_session,
            store::cmds::set_session_pinned,
            store::cmds::create_session,
            store::cmds::start_thread,
            store::cmds::fork_thread,
            store::cmds::send_child_thread_follow_up,
            store::cmds::set_child_supervision_loop,
            store::cmds::cancel_current_run,
            // View
            store::cmds::set_active_view,
            store::cmds::set_sidebar_collapsed,
            store::cmds::refresh_runtime,
            // Model
            store::cmds::set_model_settings_scope_mode,
            store::cmds::set_default_model,
            store::cmds::set_default_thinking_level,
            store::cmds::set_session_model,
            store::cmds::set_session_thinking_level,
            store::cmds::login_provider,
            store::cmds::logout_provider,
            store::cmds::set_provider_api_key,
            store::cmds::list_custom_providers,
            store::cmds::set_custom_provider,
            store::cmds::delete_custom_provider,
            store::cmds::probe_custom_provider_models,
            store::cmds::set_enable_skill_commands,
            store::cmds::set_scoped_model_patterns,
            store::cmds::set_skill_enabled,
            store::cmds::set_extension_enabled,
            store::cmds::respond_to_host_ui_request,
            // Runtime
            store::cmds::get_runtime_info,
            // Notifications
            store::cmds::set_notification_preferences,
            store::cmds::set_integrated_terminal_shell,
            store::cmds::set_enable_transparency,
            store::cmds::get_notification_permission_status,
            store::cmds::request_notification_permission,
            store::cmds::open_system_notification_settings,
            // Composer
            store::cmds::pick_composer_attachments,
            store::cmds::add_composer_attachments,
            store::cmds::remove_composer_attachment,
            store::cmds::edit_queued_composer_message,
            store::cmds::cancel_queued_composer_edit,
            store::cmds::remove_queued_composer_message,
            store::cmds::steer_queued_composer_message,
            store::cmds::update_composer_draft,
            store::cmds::submit_composer,
            // Session tree
            store::cmds::get_session_tree,
            store::cmds::navigate_session_tree,
            // Workspace files
            store::cmds::list_workspace_files,
            store::cmds::read_workspace_file,
            store::cmds::get_changed_files,
            store::cmds::get_file_diff,
            store::cmds::stage_file,
            // Window
            store::cmds::toggle_window_maximize,
            store::cmds::open_external,
            // Theme
            store::cmds::get_theme_mode,
            store::cmds::get_resolved_theme,
            store::cmds::set_theme_mode,
            store::cmds::set_theme_preset_id,
            // Transcript
            store::cmds::get_selected_transcript,
            // Terminal
            store::cmds::ensure_terminal_panel,
            store::cmds::create_terminal_session,
            store::cmds::set_active_terminal_session,
            store::cmds::write_terminal,
            store::cmds::resize_terminal,
            store::cmds::restart_terminal_session,
            store::cmds::close_terminal_session,
            store::cmds::set_terminal_title,
            store::cmds::set_terminal_focused,
        ])
        .run(tauri::generate_context!())
        .expect("error while running pi-gui-rs");
}
