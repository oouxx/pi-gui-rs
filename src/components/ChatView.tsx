import { useCallback, useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useChat } from "@/hooks/useChat"

const mdComponents: Components = {
  code: ({ className, children, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="bg-bg-hover text-ink rounded px-1 py-0.5 font-mono text-xs" {...props}>
          {children}
        </code>
      )
    }
    return (
      <pre className="rounded-card border-hairline bg-bg-hover text-ink-muted my-2 overflow-x-auto border p-3 font-mono text-xs leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-hairline bg-bg-hover text-ink-muted border-b px-3 py-2 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-hairline text-ink-muted border-b px-3 py-2">{children}</td>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-ai hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-1 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal space-y-1 pl-5">{children}</ol>,
  hr: () => <hr className="border-hairline my-3" />,
}

export default function ChatView() {
  const { messages, sendMessage, streaming, loading } = useChat()
  const [input, setInput] = useState("")
  const msgContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      if (msgContainerRef.current) {
        msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollDown()
  }, [messages, scrollDown])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput("")
    await sendMessage(text)
  }, [input, streaming, sendMessage])

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex size-full flex-col">
      {/* Header */}
      <div className="border-hairline bg-bg-surface flex flex-shrink-0 items-center gap-3 border-b px-4 py-1.5">
        <SidebarTrigger className="flex-shrink-0" />
        <div className="text-ink-muted flex flex-shrink-0 items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="font-medium text-foreground">pi-gui</span>
        </div>
      </div>

      {/* Messages or empty state */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={msgContainerRef}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5"
        >
          {isEmpty ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-[500px] text-center">
                <h2 className="mb-2 text-2xl font-medium text-foreground">
                  AI 编程助手
                </h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Start a conversation with your AI coding assistant.
                  Ask questions, request code reviews, or discuss architecture.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isLastAi = msg.role === "assistant" && idx === messages.length - 1
              return (
                <div
                  key={msg.id}
                  className={`flex max-w-[820px] gap-3 ${msg.role === "user" ? "flex-row-reverse self-end" : ""}`}
                >
                  <span
                    className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      msg.role === "user" ? "bg-ai text-white" : "bg-bg-hover text-foreground"
                    }`}
                  >
                    {msg.role === "user" ? "U" : "AI"}
                  </span>
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-ink-dim max-w-[70%] rounded-tr-sm text-foreground"
                        : "border-hairline bg-bg-surface rounded-tl-sm border text-foreground/80"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={mdComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : streaming && isLastAi ? (
                        <div className="flex gap-1 py-1">
                          <span className="bg-muted-foreground size-1.5 animate-pulse rounded-full" />
                          <span
                            className="bg-muted-foreground size-1.5 animate-pulse rounded-full"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <span
                            className="bg-muted-foreground size-1.5 animate-pulse rounded-full"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      ) : null
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Composer */}
        <div className="border-hairline bg-bg-surface flex-shrink-0 border-t px-4 py-2">
          <div className="relative mx-auto max-w-[820px]">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              disabled={streaming || loading}
              className="max-h-[120px] min-h-[44px] resize-none pr-12 text-sm"
              rows={1}
            />
            <Button
              size="icon"
              className="absolute right-1.5 bottom-1.5 size-8"
              onClick={handleSend}
              disabled={streaming || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
