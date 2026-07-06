import type { PiDesktopApi } from "./ipc";

export {};

declare global {
  interface Window {
    piApp?: PiDesktopApi;
  }
}

// ── CSS module declarations ──────────────────────────────────
declare module "@xterm/xterm/css/xterm.css" {
  const _: string;
  export default _;
}
