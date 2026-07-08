/* ── Inline SDK type definitions ───────────────────────────── */

export interface SessionTranscriptMessage {
  id: string;
  role: SessionTranscriptRole;
  text: string;
  attachments?: SessionTranscriptAttachment[];
  [key: string]: unknown;
}
export type SessionTranscriptRole = "user" | "assistant" | "branchSummary" | "compactionSummary" | "system";
export interface SessionTranscriptAttachment {
  kind: "image" | "file";
  name?: string;
  mimeType?: string;
  data?: string;
  fsPath?: string;
  [key: string]: unknown;
}
export interface SessionSchemaInfo {
  version: string;
  [key: string]: unknown;
}
export interface CustomProviderEndpoint {
  providerId: string;
  baseUrl: string;
  apiKey?: string;
  [key: string]: unknown;
}
export interface SessionConfig {
  provider?: string;
  modelId?: string;
  thinkingLevel?: string;
  [key: string]: unknown;
}
export interface HostUiRequest {
  type: string;
  [key: string]: unknown;
}
export interface HostUiResponse {
  [key: string]: unknown;
}
export type SessionTreeNodeKind = string;

export interface SessionTreeNodeSnapshot {
  id: string;
  kind: SessionTreeNodeKind;
  children: readonly SessionTreeNodeSnapshot[];
  role?: string;
  preview?: string;
  label?: string;
  title?: string;
  customType?: string;
  [key: string]: unknown;
}

export interface SessionTreeSnapshot {
  id: string;
  label?: string;
  roots: readonly SessionTreeNodeSnapshot[];
  leafId?: string;
  [key: string]: unknown;
}
export interface NavigateSessionTreeOptions {
  [key: string]: unknown;
}
export interface NavigateSessionTreeResult {
  cancelled: boolean;
  [key: string]: unknown;
}
export interface CustomProviderConfig {
  name: string;
  baseUrl: string;
  [key: string]: unknown;
}
export type DesktopNotificationPermissionStatus = "granted" | "denied" | "default";
export interface PiDesktopCommand {
  type: string;
  [key: string]: unknown;
}
export interface RuntimeSnapshot {
  activeSessionId?: string;
  activeWorkspaceId?: string;
  settings?: RuntimeSettingsSnapshot;
  [key: string]: unknown;
}
export interface ModelSettingsSnapshot {
  provider?: string;
  modelId?: string;
  [key: string]: unknown;
}
export interface RuntimeCommandRecord {
  name: string;
  description?: string;
  [key: string]: unknown;
}
export interface RuntimeSettingsSnapshot {
  defaultProvider?: string;
  defaultModel?: string;
  defaultModelId?: string;
  defaultThinkingLevel?: string;
  enabledModelPatterns?: readonly string[];
  [key: string]: unknown;
}

export interface RuntimeProviderRecord {
  id: string;
  name: string;
  authSource?: string;
  oauthSupported?: boolean;
  apiKeySetupSupported?: boolean;
  hasAuth?: boolean;
  [key: string]: unknown;
}
export interface RuntimeSkillRecord {
  filePath: string;
  name: string;
  enabled: boolean;
  [key: string]: unknown;
}

export interface RuntimeExtensionRecord {
  name: string;
  [key: string]: unknown;
}

export function isValidHttpBaseUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}
export const CUSTOM_PROVIDER_ID_PATTERN = /^[a-z0-9-]+$/;

// ── Dev-reload probe stubs ──────────────────────────────────
export const RENDERER_DEV_RELOAD_MARKER = "tauri";
export function pipedDevReloadProbe() { return null; }

