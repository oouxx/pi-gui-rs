import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createTauriPiApp } from "./tauri-adapter";
import "./styles.css";

// Provide pi-gui's expected window.piApp API backed by Tauri invoke
createTauriPiApp().then((api) => {
  window.piApp = api;
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
