import type { PiDesktopApi } from "./types";

export {};

declare global {
  interface Window {
    piApp?: PiDesktopApi;
  }
}

// ── CSS module declarations ──────────────────────────────────
declare module "*.css" {
  const content: string;
  export default content;
}
declare module "@xterm/xterm/css/xterm.css" {
  const _: string;
  export default _;
}
