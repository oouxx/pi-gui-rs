import type { DesktopAppState, SelectedTranscriptRecord } from "../types";
import { desktopIpc } from "./commands";

// ── Low-level Tauri listen ────────────────────────────────────

export async function tauriListen<T>(event: string, handler: (payload: T) => void) {
  const { listen } = await import("@tauri-apps/api/event");
  return listen(event, (e) => handler(e.payload as T));
}

// ── Event setup ───────────────────────────────────────────────

export interface EventSubscriptions {
  state: () => void;
  transcript: () => void;
}

export async function setupStateListener(
  handler: (state: DesktopAppState) => void,
): Promise<() => void> {
  const unsub = await tauriListen<DesktopAppState>(desktopIpc.stateChanged, handler);
  return unsub;
}

export async function setupTranscriptListener(
  handler: (payload: SelectedTranscriptRecord | null) => void,
): Promise<() => void> {
  const unsub = await tauriListen<SelectedTranscriptRecord | null>(
    desktopIpc.selectedTranscriptChanged,
    handler,
  );
  return unsub;
}
