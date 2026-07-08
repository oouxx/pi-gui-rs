import type {
  DesktopAppState, SelectedTranscriptRecord, WorkspaceSessionTarget,
  CreateSessionInput, StartThreadInput, ForkThreadInput,
  CreateWorktreeInput, RemoveWorktreeInput,
  SendChildThreadFollowUpInput, SetChildSupervisionLoopInput,
  ComposerAttachment, ThemePresetId,
  ModelSettingsScopeMode, NotificationPreferences,
} from "../types";
import type {
  CustomProviderConfig, CustomProviderProbeInput, CustomProviderProbeResult,
  DesktopPlatform, PiDesktopCommand, TerminalPanelSnapshot,
  TerminalSize,
} from "../types";

// ── IPC channel names ────────────────────────────────────────

export const desktopIpc = {
  stateRequest: "pi-gui:state-request",
  stateChanged: "pi-gui:state-changed",
  selectedTranscriptRequest: "pi-gui:selected-transcript-request",
  selectedTranscriptChanged: "pi-gui:selected-transcript-changed",
  appCommand: "pi-gui:app-command",
  workspacePicked: "pi-gui:workspace-picked",
  clipboardImagePasted: "pi-gui:clipboard-image-pasted",
  addWorkspacePath: "pi-gui:add-workspace-path",
  pickWorkspace: "pi-gui:pick-workspace",
  selectWorkspace: "pi-gui:select-workspace",
  renameWorkspace: "pi-gui:rename-workspace",
  removeWorkspace: "pi-gui:remove-workspace",
  reorderWorkspaces: "pi-gui:reorder-workspaces",
  reorderPinnedSessions: "pi-gui:reorder-pinned-sessions",
  openWorkspaceInFinder: "pi-gui:open-workspace-in-finder",
  createWorktree: "pi-gui:create-worktree",
  removeWorktree: "pi-gui:remove-worktree",
  openSkillInFinder: "pi-gui:open-skill-in-finder",
  openExtensionInFinder: "pi-gui:open-extension-in-finder",
  syncCurrentWorkspace: "pi-gui:sync-current-workspace",
  selectSession: "pi-gui:select-session",
  archiveSession: "pi-gui:archive-session",
  unarchiveSession: "pi-gui:unarchive-session",
  setSessionPinned: "pi-gui:set-session-pinned",
  createSession: "pi-gui:create-session",
  startThread: "pi-gui:start-thread",
  forkThread: "pi-gui:fork-thread",
  sendChildThreadFollowUp: "pi-gui:send-child-thread-follow-up",
  setChildSupervisionLoop: "pi-gui:set-child-supervision-loop",
  cancelCurrentRun: "pi-gui:cancel-current-run",
  setActiveView: "pi-gui:set-active-view",
  setSidebarCollapsed: "pi-gui:set-sidebar-collapsed",
  refreshRuntime: "pi-gui:refresh-runtime",
  setModelSettingsScopeMode: "pi-gui:set-model-settings-scope-mode",
  setDefaultModel: "pi-gui:set-default-model",
  setDefaultThinkingLevel: "pi-gui:set-default-thinking-level",
  setSessionModel: "pi-gui:set-session-model",
  setSessionThinkingLevel: "pi-gui:set-session-thinking-level",
  loginProvider: "pi-gui:login-provider",
  logoutProvider: "pi-gui:logout-provider",
  setProviderApiKey: "pi-gui:set-provider-api-key",
  listCustomProviders: "pi-gui:list-custom-providers",
  setCustomProvider: "pi-gui:set-custom-provider",
  deleteCustomProvider: "pi-gui:delete-custom-provider",
  probeCustomProviderModels: "pi-gui:probe-custom-provider-models",
  setEnableSkillCommands: "pi-gui:set-enable-skill-commands",
  setScopedModelPatterns: "pi-gui:set-scoped-model-patterns",
  setSkillEnabled: "pi-gui:set-skill-enabled",
  setExtensionEnabled: "pi-gui:set-extension-enabled",
  respondToHostUiRequest: "pi-gui:respond-to-host-ui-request",
  setNotificationPreferences: "pi-gui:set-notification-preferences",
  setIntegratedTerminalShell: "pi-gui:set-integrated-terminal-shell",
  setEnableTransparency: "pi-gui:set-enable-transparency",
  terminalEnsurePanel: "pi-gui:terminal-ensure-panel",
  terminalCreateSession: "pi-gui:terminal-create-session",
  terminalSetActiveSession: "pi-gui:terminal-set-active-session",
  terminalWrite: "pi-gui:terminal-write",
  terminalResize: "pi-gui:terminal-resize",
  terminalRestartSession: "pi-gui:terminal-restart-session",
  terminalCloseSession: "pi-gui:terminal-close-session",
  terminalSetTitle: "pi-gui:terminal-set-title",
  terminalSetFocused: "pi-gui:terminal-set-focused",
  terminalData: "pi-gui:terminal-data",
  terminalExit: "pi-gui:terminal-exit",
  terminalError: "pi-gui:terminal-error",
  getNotificationPermissionStatus: "pi-gui:get-notification-permission-status",
  requestNotificationPermission: "pi-gui:request-notification-permission",
  openSystemNotificationSettings: "pi-gui:open-system-notification-settings",
  notificationPermissionStatusChanged: "pi-gui:notification-permission-status-changed",
  pickComposerAttachments: "pi-gui:pick-composer-attachments",
  readClipboardImage: "pi-gui:read-clipboard-image",
  addComposerAttachments: "pi-gui:add-composer-attachments",
  removeComposerAttachment: "pi-gui:remove-composer-attachment",
  editQueuedComposerMessage: "pi-gui:edit-queued-composer-message",
  cancelQueuedComposerEdit: "pi-gui:cancel-queued-composer-edit",
  removeQueuedComposerMessage: "pi-gui:remove-queued-composer-message",
  steerQueuedComposerMessage: "pi-gui:steer-queued-composer-message",
  updateComposerDraft: "pi-gui:update-composer-draft",
  submitComposer: "pi-gui:submit-composer",
  getSessionTree: "pi-gui:get-session-tree",
  navigateSessionTree: "pi-gui:navigate-session-tree",
  toggleWindowMaximize: "pi-gui:toggle-window-maximize",
  listWorkspaceFiles: "pi-gui:list-workspace-files",
  readWorkspaceFile: "pi-gui:read-workspace-file",
  getChangedFiles: "pi-gui:get-changed-files",
  getFileDiff: "pi-gui:get-file-diff",
  stageFile: "pi-gui:stage-file",
  getThemeMode: "pi-gui:get-theme-mode",
  getResolvedTheme: "pi-gui:get-resolved-theme",
  setThemeMode: "pi-gui:set-theme-mode",
  setThemePresetId: "pi-gui:set-theme-preset-id",
  themeChanged: "pi-gui:theme-changed",
  ping: "app:ping",
  openExternal: "app:open-external",
} as const;

export const desktopCommands = {
  openSettings: "open-settings",
  openNewThread: "open-new-thread",
  toggleTerminal: "toggle-terminal",
  toggleSidebar: "toggle-sidebar",
} as const;

// ── Shortcuts ─────────────────────────────────────────────────

export function getDesktopShortcutLabel(platform: DesktopPlatform, key: string): string {
  return `${platform === "darwin" ? "⌘" : "Ctrl+"}${key.toUpperCase()}`;
}

export function getDesktopCommandFromShortcut(input: {
  modifier: boolean;
  shift: boolean;
  key: string;
  code?: string;
}): PiDesktopCommand | undefined {
  if (!input.modifier) return undefined;

  const lowerKey = input.key.toLowerCase();
  const isComma = input.key === "," || input.code === "Comma";
  const isB = lowerKey === "b" || input.code === "KeyB";
  const isJ = lowerKey === "j" || input.code === "KeyJ";
  const isShiftO = input.shift && (lowerKey === "o" || input.code === "KeyO");

  if (!input.shift && isComma) return desktopCommands.openSettings;
  if (!input.shift && isJ) return desktopCommands.toggleTerminal;
  if (!input.shift && isB) return desktopCommands.toggleSidebar;
  if (isShiftO) return desktopCommands.openNewThread;

  return undefined;
}

// ── Low-level Tauri invoke ────────────────────────────────────

export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const ipc = (window as any).__TAURI_INTERNALS__;
  console.log(`[IPC →] ${cmd}`, args);
  const result = await (ipc.invoke(cmd, args) as Promise<T>);
  console.log(`[IPC ←] ${cmd}`, result);
  return result;
}

// ── Command wrappers ──────────────────────────────────────────

export function ping() { return tauriInvoke<string>("ping"); }
export function getState() { return tauriInvoke<DesktopAppState>("get_state"); }
export function getSelectedTranscript() { return tauriInvoke<SelectedTranscriptRecord | null>("get_selected_transcript"); }

// Workspace
export function addWorkspacePath(path: string) { return tauriInvoke<DesktopAppState>("add_workspace_path", { path }); }
export function pickWorkspace() { return tauriInvoke<DesktopAppState>("pick_workspace"); }
export function selectWorkspace(workspaceId: string) { return tauriInvoke<DesktopAppState>("select_workspace", { workspaceId }); }
export function renameWorkspace(workspaceId: string, displayName: string) { return tauriInvoke<DesktopAppState>("rename_workspace", { workspaceId, displayName }); }
export function removeWorkspace(workspaceId: string) { return tauriInvoke<DesktopAppState>("remove_workspace", { workspaceId }); }
export function reorderWorkspaces(workspaceOrder: readonly string[]) { return tauriInvoke<DesktopAppState>("reorder_workspaces", { workspaceOrder }); }
export function reorderPinnedSessions(pinnedSessionOrder: readonly string[]) { return tauriInvoke<DesktopAppState>("reorder_pinned_sessions", { pinnedSessionOrder }); }
export function openWorkspaceInFinder(workspaceId: string) { return tauriInvoke<void>("open_workspace_in_finder", { workspaceId }); }
export function createWorktree(input: CreateWorktreeInput) { return tauriInvoke<DesktopAppState>("create_worktree", { input }); }
export function removeWorktree(input: RemoveWorktreeInput) { return tauriInvoke<DesktopAppState>("remove_worktree", { input }); }
export function openSkillInFinder(workspaceId: string, filePath: string) { return tauriInvoke<void>("open_skill_in_finder", { workspaceId, filePath }); }
export function openExtensionInFinder(workspaceId: string, filePath: string) { return tauriInvoke<void>("open_extension_in_finder", { workspaceId, filePath }); }
export function syncCurrentWorkspace() { return tauriInvoke<DesktopAppState>("sync_current_workspace"); }

// Session
export function selectSession(target: WorkspaceSessionTarget) { return tauriInvoke<DesktopAppState>("select_session", { target }); }
export function archiveSession(target: WorkspaceSessionTarget) { return tauriInvoke<DesktopAppState>("archive_session", { target }); }
export function unarchiveSession(target: WorkspaceSessionTarget) { return tauriInvoke<DesktopAppState>("unarchive_session", { target }); }
export function setSessionPinned(target: WorkspaceSessionTarget, pinned: boolean) { return tauriInvoke<DesktopAppState>("set_session_pinned", { target, pinned }); }
export function createSession(input: CreateSessionInput) { return tauriInvoke<DesktopAppState>("create_session", { input }); }
export function startThread(input: StartThreadInput) { return tauriInvoke<DesktopAppState>("start_thread", { input }); }
export function forkThread(input: ForkThreadInput) { return tauriInvoke<DesktopAppState>("fork_thread", { input }); }
export function sendChildThreadFollowUp(input: SendChildThreadFollowUpInput) { return tauriInvoke<DesktopAppState>("send_child_thread_follow_up", { input }); }
export function setChildSupervisionLoop(input: SetChildSupervisionLoopInput) { return tauriInvoke<DesktopAppState>("set_child_supervision_loop", { input }); }
export function cancelCurrentRun() { return tauriInvoke<DesktopAppState>("cancel_current_run"); }

// View
export function setActiveView(view: string) { return tauriInvoke<DesktopAppState>("set_active_view", { view }); }
export function setSidebarCollapsed(collapsed: boolean) { return tauriInvoke<DesktopAppState>("set_sidebar_collapsed", { collapsed }); }
export function refreshRuntime(workspaceId?: string) { return tauriInvoke<DesktopAppState>("refresh_runtime", { workspaceId }); }

// Model
export function setModelSettingsScopeMode(mode: ModelSettingsScopeMode) { return tauriInvoke<DesktopAppState>("set_model_settings_scope_mode", { mode }); }
export function setDefaultModel(workspaceId: string, provider: string, modelId: string) { return tauriInvoke<DesktopAppState>("set_default_model", { workspaceId, provider, modelId }); }
export function setDefaultThinkingLevel(workspaceId: string, thinkingLevel: string | undefined) { return tauriInvoke<DesktopAppState>("set_default_thinking_level", { workspaceId, thinkingLevel }); }
export function setSessionModel(workspaceId: string, sessionId: string, provider: string, modelId: string) { return tauriInvoke<DesktopAppState>("set_session_model", { workspaceId, sessionId, provider, modelId }); }
export function setSessionThinkingLevel(workspaceId: string, sessionId: string, thinkingLevel: string) { return tauriInvoke<DesktopAppState>("set_session_thinking_level", { workspaceId, sessionId, thinkingLevel }); }
export function loginProvider(workspaceId: string, providerId: string) { return tauriInvoke<DesktopAppState>("login_provider", { workspaceId, providerId }); }
export function logoutProvider(workspaceId: string, providerId: string) { return tauriInvoke<DesktopAppState>("logout_provider", { workspaceId, providerId }); }
export function setProviderApiKey(workspaceId: string, providerId: string, apiKey: string) { return tauriInvoke<DesktopAppState>("set_provider_api_key", { workspaceId, providerId, apiKey }); }
export function listCustomProviders() { return tauriInvoke<readonly CustomProviderConfig[]>("list_custom_providers"); }
export function setCustomProvider(workspaceId: string, config: CustomProviderConfig) { return tauriInvoke<DesktopAppState>("set_custom_provider", { workspaceId, config }); }
export function deleteCustomProvider(workspaceId: string, providerId: string) { return tauriInvoke<DesktopAppState>("delete_custom_provider", { workspaceId, providerId }); }
export function probeCustomProviderModels(input: CustomProviderProbeInput) { return tauriInvoke<CustomProviderProbeResult>("probe_custom_provider_models", { input }); }
export function setEnableSkillCommands(workspaceId: string, enabled: boolean) { return tauriInvoke<DesktopAppState>("set_enable_skill_commands", { workspaceId, enabled }); }
export function setScopedModelPatterns(workspaceId: string, patterns: readonly string[]) { return tauriInvoke<DesktopAppState>("set_scoped_model_patterns", { workspaceId, patterns }); }
export function setSkillEnabled(workspaceId: string, filePath: string, enabled: boolean) { return tauriInvoke<DesktopAppState>("set_skill_enabled", { workspaceId, filePath, enabled }); }
export function setExtensionEnabled(workspaceId: string, filePath: string, enabled: boolean) { return tauriInvoke<DesktopAppState>("set_extension_enabled", { workspaceId, filePath, enabled }); }
export function respondToHostUiRequest(workspaceId: string, sessionId: string, response: unknown) { return tauriInvoke<DesktopAppState>("respond_to_host_ui_request", { workspaceId, sessionId, response }); }

// Notifications
export function setNotificationPreferences(preferences: Partial<NotificationPreferences>) { return tauriInvoke<DesktopAppState>("set_notification_preferences", { preferences }); }
export function setIntegratedTerminalShell(shell: string) { return tauriInvoke<DesktopAppState>("set_integrated_terminal_shell", { shell }); }
export function setEnableTransparency(enabled: boolean) { return tauriInvoke<DesktopAppState>("set_enable_transparency", { enabled }); }
export function setThemePresetId(presetId: ThemePresetId) { return tauriInvoke<DesktopAppState>("set_theme_preset_id", { presetId }); }

// Terminal
export function ensureTerminalPanel(workspaceId: string, terminalScopeId: string, size?: Partial<TerminalSize>) { return tauriInvoke<TerminalPanelSnapshot>("ensure_terminal_panel", { workspaceId, terminalScopeId, size }); }
export function createTerminalSession(workspaceId: string, terminalScopeId: string, size?: Partial<TerminalSize>) { return tauriInvoke<TerminalPanelSnapshot>("create_terminal_session", { workspaceId, terminalScopeId, size }); }
export function setActiveTerminalSession(workspaceId: string, terminalScopeId: string, terminalId: string) { return tauriInvoke<TerminalPanelSnapshot>("set_active_terminal_session", { workspaceId, terminalScopeId, terminalId }); }
export function writeTerminal(terminalId: string, data: string) { return tauriInvoke<void>("write_terminal", { terminalId, data }); }
export function resizeTerminal(terminalId: string, size: TerminalSize) { return tauriInvoke<void>("resize_terminal", { terminalId, size }); }
export function restartTerminalSession(terminalId: string, size?: Partial<TerminalSize>) { return tauriInvoke<TerminalPanelSnapshot>("restart_terminal_session", { terminalId, size }); }
export function closeTerminalSession(terminalId: string) { return tauriInvoke<TerminalPanelSnapshot | null>("close_terminal_session", { terminalId }); }
export function setTerminalTitle(terminalId: string, title: string) { return tauriInvoke<void>("set_terminal_title", { terminalId, title }); }
export function setTerminalFocused(focused: boolean) { tauriInvoke<void>("set_terminal_focused", { focused }).catch(() => {}); }

// Notifications permission
export function getNotificationPermissionStatus() { return tauriInvoke<string>("get_notification_permission_status"); }
export function requestNotificationPermission() { return tauriInvoke<string>("request_notification_permission"); }
export function openSystemNotificationSettings() { return tauriInvoke<void>("open_system_notification_settings"); }

// Composer
export function pickComposerAttachments() { return tauriInvoke<DesktopAppState>("pick_composer_attachments"); }
export function addComposerAttachments(attachments: readonly ComposerAttachment[]) { return tauriInvoke<DesktopAppState>("add_composer_attachments", { attachments }); }
export function removeComposerAttachment(attachmentId: string) { return tauriInvoke<DesktopAppState>("remove_composer_attachment", { attachmentId }); }
export function editQueuedComposerMessage(messageId: string, currentDraft?: string) { return tauriInvoke<DesktopAppState>("edit_queued_composer_message", { messageId, currentDraft }); }
export function cancelQueuedComposerEdit() { return tauriInvoke<DesktopAppState>("cancel_queued_composer_edit"); }
export function removeQueuedComposerMessage(messageId: string) { return tauriInvoke<DesktopAppState>("remove_queued_composer_message", { messageId }); }
export function steerQueuedComposerMessage(messageId: string) { return tauriInvoke<DesktopAppState>("steer_queued_composer_message", { messageId }); }
export function updateComposerDraft(composerDraft: string) { return tauriInvoke<DesktopAppState>("update_composer_draft", { composerDraft }); }
export function submitComposer(text: string, options?: { readonly deliverAs?: "steer" | "followUp" }) { return tauriInvoke<DesktopAppState>("submit_composer", { text, options }); }

// Session tree
export function getSessionTree(target: WorkspaceSessionTarget) { return tauriInvoke("get_session_tree", { target }); }
export function navigateSessionTree(target: WorkspaceSessionTarget, targetId: string, options?: unknown) { return tauriInvoke<{ readonly state: DesktopAppState; readonly result: unknown }>("navigate_session_tree", { target, targetId, options }); }

// Workspace files
export function listWorkspaceFiles(workspaceId: string, options?: { readonly force?: boolean }) { return tauriInvoke<string[]>("list_workspace_files", { workspaceId, options }); }
export function readWorkspaceFile(workspaceId: string, filePath: string) { return tauriInvoke("read_workspace_file", { workspaceId, filePath }); }
export function getChangedFiles(workspaceId: string) { return tauriInvoke("get_changed_files", { workspaceId }); }
export function getFileDiff(workspaceId: string, filePath: string) { return tauriInvoke<string>("get_file_diff", { workspaceId, filePath }); }
export function stageFile(workspaceId: string, filePath: string) { return tauriInvoke<void>("stage_file", { workspaceId, filePath }); }

// Window
export function toggleWindowMaximize() { return tauriInvoke<void>("toggle_window_maximize"); }
export function openExternal(url: string) { return tauriInvoke<void>("open_external", { url }); }

// Theme
export function getThemeMode() { return tauriInvoke<"system" | "light" | "dark">("get_theme_mode"); }
export function getResolvedTheme() { return tauriInvoke<"light" | "dark">("get_resolved_theme"); }
export function setThemeMode(mode: "system" | "light" | "dark") { return tauriInvoke<DesktopAppState>("set_theme_mode", { mode }); }
