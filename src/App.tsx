import { useEffect, useState } from "react";
import type { DesktopAppState } from "./desktop-state";

function useDesktopAppState() {
  const [snapshot, setSnapshot] = useState<DesktopAppState | null>(null);

  useEffect(() => {
    const api = window.piApp;
    if (!api) return;

    let active = true;
    void api.getState().then((state) => { if (active) setSnapshot(state); });

    const unsub = api.onStateChanged((state) => { if (active) setSnapshot(state); });
    return () => { active = false; unsub(); };
  }, []);

  return snapshot;
}

export default function App() {
  const snapshot = useDesktopAppState();

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>pi-gui</h1>
      <p style={{ color: "#747d93", marginTop: 8 }}>
        {snapshot ? `${snapshot.workspaces.length} workspaces` : "Loading…"}
      </p>
    </div>
  );
}
