# pi-gui-rs

A Tauri v2 + React 19 desktop GUI for [pi-coding-agent](https://github.com/earendil-works/pi) (Rust port).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Agent Runtime | pi-rs (Rust) — direct crate dependency |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  WebView (React 19 + shadcn)                    │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │ ChatArea   │  │ ChatInput  │  │ usePiAgent │ │
│  └───────────┘  └────────────┘  └─────┬──────┘ │
│                                       │         │
│                 @tauri-apps/api (invoke / listen) │
└───────────────────────┬─────────────────────────┘
                        │ Tauri IPC
┌───────────────────────┴─────────────────────────┐
│  pi-gui-rs (Rust)                                │
│  ┌────────────────────────────────────────────┐ │
│  │  lib.rs                                    │ │
│  │  ├── create_session()  → AgentSession      │ │
│  │  ├── send_message()    → add_user_text()   │ │
│  │  ├── abort()           → agent.abort()     │ │
│  │  ├── get_messages()    → get_messages()    │ │
│  │  └── is_streaming()    → AtomicBool        │ │
│  └──────────────┬─────────────────────────────┘ │
└─────────────────┼───────────────────────────────┘
                  │ Rust path dependency
┌─────────────────┴───────────────────────────────┐
│  pi-rs (workspace at ../pi-rs)                   │
│  ├─ pi-coding-agent   (session / CLI logic)      │
│  ├─ pi-agent-core     (AgentLoop, types, tools)  │
│  └─ pi-ai             (providers, streaming)     │
└─────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Install frontend dependencies
npm install

# 2. Run in dev mode (requires Rust toolchain)
npm run tauri:dev

# 3. Build for production
npm run tauri:build
```

> **Note:** This project depends on `pi-rs` crates via relative path
> (`../pi-rs/crates/pi-coding-agent`). Make sure `pi-rs` is cloned at
> `../pi-rs/` relative to this project, or adjust `Cargo.toml`.

## Project Structure

```
pi-gui-rs/
├── src/                     # React Frontend
│   ├── App.tsx              # Main app layout
│   ├── main.tsx             # Entry point
│   ├── index.css            # Tailwind v4 + shadcn theme
│   ├── components/
│   │   ├── ui/              # shadcn UI primitives
│   │   └── chat/            # Chat components
│   ├── hooks/
│   │   └── usePiAgent.ts    # Agent state management
│   └── lib/
│       └── utils.ts         # cn() utility
├── src-tauri/               # Tauri Rust backend
│   ├── src/lib.rs           # Commands: create_session, send_message, abort, ...
│   ├── src/main.rs          # Entry point
│   ├── Cargo.toml           # Depends on pi-coding-agent via path
│   └── tauri.conf.json
├── package.json
└── components.json          # shadcn config
```

## Adding shadcn Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add avatar
npx shadcn@latest add tooltip
```

## Environment

The app reads pi-rs standard config files and environment variables for API keys:
- `~/.pi-rs/agent/settings.json` or `{cwd}/.pi/config.json`
- Environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.
