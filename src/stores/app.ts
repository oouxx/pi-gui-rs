import type { DesktopAppState, SessionRecord, WorkspaceRecord } from "../types";

export function createEmptyDesktopAppState(): DesktopAppState {
  return {
    workspaces: [],
    worktreesByWorkspace: {},
    selectedWorkspaceId: "",
    selectedSessionId: "",
    activeView: "threads",
    composerDraft: "",
    composerDraftSyncSource: "state",
    composerDraftSyncNonce: 0,
    composerAttachments: [],
    queuedComposerMessages: [],
    runtimeByWorkspace: {},
    sessionCommandsBySession: {},
    sessionExtensionUiBySession: {},
    extensionCommandCompatibilityByWorkspace: {},
    orchestrationChildren: [],
    notificationPreferences: {
      backgroundCompletion: true,
      backgroundFailure: true,
      attentionNeeded: true,
    },
    integratedTerminalShell: "",
    lastViewedAtBySession: {},
    pinnedAtBySession: {},
    pinnedSessionOrder: [],
    workspaceOrder: [],
    modelSettingsScopeMode: "app-global",
    globalModelSettings: {
      enabledModelPatterns: [],
    },
    themeMode: "system",
    themePresetId: "default",
    sidebarCollapsed: false,
    enableTransparency: false,
    revision: 0,
  };
}

export function getSelectedWorkspace(state: DesktopAppState): WorkspaceRecord | undefined {
  return state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId);
}

export function getSelectedSession(state: DesktopAppState): SessionRecord | undefined {
  return getSelectedWorkspace(state)?.sessions.find((session) => session.id === state.selectedSessionId);
}
