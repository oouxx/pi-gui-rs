import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Search, Settings, Puzzle, Code2, Plus, Trash2, Archive } from "lucide-react"
import { useChat } from "@/hooks/useChat"
import type { AppView } from "./AppShell"

interface PiSidebarProps {
  mode: AppView
  onModeChange: (mode: AppView) => void
}

export default function PiSidebar({ mode, onModeChange }: PiSidebarProps) {
  const { sessions, activeSessionId, selectSession, createSession, deleteSession, archiveSession, loading } = useChat()
  const [search, setSearch] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const matches = (s: { title: string }) =>
    !search.trim() || s.title.toLowerCase().includes(search.trim().toLowerCase())

  const filteredSessions = sessions.filter(matches)

  const handleDelete = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId)
    setConfirmDeleteId(null)
  }, [deleteSession])

  const handleArchive = useCallback(async (sessionId: string) => {
    await archiveSession(sessionId)
  }, [archiveSession])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await createSession(); onModeChange("chat"); }} tooltip="New thread">
              <Plus />
              <span>New thread</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onModeChange(mode === "skills" ? "chat" : "skills")}
                isActive={mode === "skills"}
                tooltip="Skills"
              >
                <Code2 />
                <span>Skills</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onModeChange(mode === "extensions" ? "chat" : "extensions")}
                isActive={mode === "extensions"}
                tooltip="Extensions"
              >
                <Puzzle />
                <span>Extensions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
          </div>
        </SidebarGroup>
        <SidebarGroup className="min-h-0 flex-1 overflow-y-auto">
          <SidebarMenu>
            {loading ? (
              <div className="text-muted-foreground py-8 text-center text-xs">Loading...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-xs">
                {search.trim() ? "No matching sessions" : "No sessions yet"}
              </div>
            ) : (
              filteredSessions.map((s) => (
                <SidebarMenuItem key={s.id} className="group/item">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="relative flex items-center">
                        <SidebarMenuButton
                          isActive={activeSessionId === s.id}
                          onClick={() => { onModeChange("chat"); selectSession(s.id); }}
                          tooltip={s.title}
                        >
                          <span className={`size-1.5 flex-shrink-0 rounded-full ${activeSessionId === s.id ? "bg-accent" : "bg-muted-foreground"}`} />
                          <span className="flex-1 truncate">{s.title}</span>
                        </SidebarMenuButton>
                        <button
                          className="text-muted-foreground hover:text-destructive absolute top-1/2 right-1.5 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id) }}
                          title="Delete permanently"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleArchive(s.id)}>
                        <Archive className="size-3.5" />
                        Archive
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => setConfirmDeleteId(s.id)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete permanently
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onModeChange(mode === "settings" ? "chat" : "settings")}
              isActive={mode === "settings"}
              tooltip="Settings"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The session file will be permanently removed from disk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border bg-background hover:bg-accent">
              Cancel
            </DialogClose>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) handleDelete(confirmDeleteId) }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
