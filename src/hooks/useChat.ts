import { useCallback, useEffect, useRef, useState } from "react"

interface DisplayMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

interface SessionItem {
  id: string
  title: string
  updatedAt: string
  status: string
}

export function useChat() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const activeWsIdRef = useRef<string>("")

  // Poll state to get sessions list + selected session
  const refreshState = useCallback(async () => {
    const api = window.piApp
    if (!api) return
    try {
      const state = await api.getState()
      const ws = state.workspaces.find((w) => w.id === state.selectedWorkspaceId)
      if (ws) activeWsIdRef.current = ws.id
      setSessions(
        (ws?.sessions ?? []).map((s) => ({
          id: s.id,
          title: s.title || "Untitled",
          updatedAt: s.updatedAt,
          status: s.status,
        })),
      )
      // Sync active session
      if (state.selectedSessionId && state.selectedSessionId !== activeSessionId) {
        setActiveSessionId(state.selectedSessionId)
      }
      setLoading(false)
    } catch { /* ignore */ }
  }, [activeSessionId])

  // Subscribe to state changes
  useEffect(() => {
    const api = window.piApp
    if (!api) return
    const unsub = api.onStateChanged(() => { refreshState() })
    refreshState()
    return unsub
  }, [refreshState])

  // Fetch & subscribe to transcript
  useEffect(() => {
    const api = window.piApp
    if (!api || !activeSessionId) return

    api.getSelectedTranscript().then((t) => {
      if (t) setMessages(transcriptToDisplay(t.transcript))
    })

    const unsub = api.onSelectedTranscriptChanged((t) => {
      if (t) setMessages(transcriptToDisplay(t.transcript))
    })
    return unsub
  }, [activeSessionId])

  const sendMessage = useCallback(async (text: string) => {
    const api = window.piApp
    if (!api || !text.trim() || streaming) return

    // If no active session, create one
    let wsId = activeWsIdRef.current
    if (!wsId) {
      const state = await api.getState()
      const ws = state.workspaces.find((w) => w.id === state.selectedWorkspaceId)
      if (!ws) {
        // Create a workspace if none exists (fallback)
        await api.addWorkspacePath("/tmp")
        const newState = await api.getState()
        wsId = newState.workspaces[0]?.id ?? ""
      } else {
        wsId = ws.id
      }
    }

    if (!activeSessionId) {
      const newState = await api.createSession({ workspaceId: wsId, title: text.slice(0, 50) })
      const newSessionId = newState.selectedSessionId
      if (!newSessionId) return
      setActiveSessionId(newSessionId)
    }
    setStreaming(true)
    try {
      await api.submitComposer(text)
    } catch { /* error handled in transcript */ }
    setStreaming(false)
  }, [activeSessionId, streaming])

  const selectSession = useCallback(async (sessionId: string) => {
    const api = window.piApp
    if (!api || !activeWsIdRef.current) return
    await api.selectSession({ workspaceId: activeWsIdRef.current, sessionId })
    setActiveSessionId(sessionId)
  }, [])

  const createSession = useCallback(async (title?: string) => {
    const api = window.piApp
    if (!api) return null as string | null
    let wsId = activeWsIdRef.current
    if (!wsId) {
      const state = await api.getState()
      const ws = state.workspaces.find((w) => w.id === state.selectedWorkspaceId)
      if (!ws) {
        await api.addWorkspacePath("/tmp")
        const newState = await api.getState()
        wsId = newState.workspaces[0]?.id ?? ""
      } else { wsId = ws.id }
    }
    if (!wsId) return null
    const newState = await api.createSession({ workspaceId: wsId, title: title || "New thread" })
    const newSessionId = newState.selectedSessionId
    if (newSessionId) setActiveSessionId(newSessionId)
    return newSessionId
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    const api = window.piApp
    if (!api || !activeWsIdRef.current) return
    await api.archiveSession({ workspaceId: activeWsIdRef.current, sessionId })
    if (activeSessionId === sessionId) setActiveSessionId(null)
    refreshState()
  }, [activeSessionId, refreshState])

  const archiveSession = useCallback(async (sessionId: string) => {
    const api = window.piApp
    if (!api || !activeWsIdRef.current) return
    await api.archiveSession({ workspaceId: activeWsIdRef.current, sessionId })
    if (activeSessionId === sessionId) setActiveSessionId(null)
    refreshState()
  }, [activeSessionId, refreshState])

  return {
    sessions,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
    archiveSession,
    messages,
    sendMessage,
    streaming,
    loading,
  }
}

function transcriptToDisplay(transcript: readonly any[]): DisplayMessage[] {
  return transcript
    .filter((t: any) => t.kind === "message" || (t.role && t.text))
    .map((t: any) => ({
      id: t.id ?? `msg-${Math.random().toString(36).slice(2, 8)}`,
      role: t.role === "user" ? "user" as const : "assistant" as const,
      content: t.text ?? t.content ?? "",
      createdAt: t.createdAt ?? "",
    }))
}
