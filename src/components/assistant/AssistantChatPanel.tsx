import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Bot, ExternalLink, LoaderCircle, Maximize2, MessageCircleQuestion, Plus, Square, Trash2, X } from 'lucide-react'
import { useAssistant } from '@/hooks/useAssistant'
import { cn } from '@/lib/utils'

const quickPrompts = ['推荐几款热门游戏', '最近有哪些热门讨论？', '我想找角色扮演游戏']

export function AssistantChatPanel({ variant, onClose }: { variant: 'drawer' | 'page'; onClose?: () => void }) {
  const { messages, isLoadingHistory, isStreaming, error, send, stop, startNewConversation, clearConversation } = useAssistant()
  const [input, setInput] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isStreaming])

  const submit = () => {
    const content = input.trim()
    if (!content || isStreaming) return
    setInput('')
    void send(content)
  }

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden bg-white',
        variant === 'drawer' ? 'h-full' : 'min-h-[650px] rounded-lg border border-border shadow-sm',
      )}
      aria-label="D-Game 智能助手"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-[#2d2d2d] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-[#1f250c]">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black">D-Game 智能助手</h1>
            <p className="text-xs text-white/55">站内游戏与社区导览</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" title="新建对话" aria-label="新建对话" onClick={startNewConversation} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" title="清空当前对话" aria-label="清空当前对话" onClick={() => void clearConversation()} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <Trash2 className="h-4 w-4" />
          </button>
          {onClose && (
            <>
              <Link to="/assistant" onClick={onClose} title="在独立页面打开" aria-label="在独立页面打开" className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white">
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button type="button" title="关闭助手" aria-label="关闭助手" onClick={onClose} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> 加载对话中
          </div>
        ) : messages.length === 0 ? (
          <EmptyConversation onPrompt={(prompt) => void send(prompt)} />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <article key={message.id} className={cn('flex flex-col', message.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn('max-w-[88%] whitespace-pre-wrap break-words rounded-lg px-3 py-2.5 text-sm leading-6', message.role === 'user' ? 'bg-primary text-[#1f250c]' : 'bg-muted text-text')}>
                  {message.content || (isStreaming && message.role === 'assistant' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : '')}
                </div>
                {message.sources.length > 0 && <SourceList sources={message.sources} />}
              </article>
            ))}
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {error && <p role="alert" className="mx-4 mb-2 rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}

      <form
        className="shrink-0 border-t border-border bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="flex items-end gap-2 rounded-lg border border-border bg-muted p-2 focus-within:border-primary">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            maxLength={1200}
            rows={2}
            placeholder="问问游戏、评分或社区讨论"
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-5 text-text outline-none placeholder:text-text-secondary"
            aria-label="输入给智能助手的消息"
          />
          {isStreaming ? (
            <button type="button" title="停止生成" aria-label="停止生成" onClick={stop} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2d2d2d] text-white hover:bg-[#1d1d1d]">
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button type="submit" title="发送消息" aria-label="发送消息" disabled={!input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-[#1f250c] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function EmptyConversation({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
        <MessageCircleQuestion className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-black text-text">找到下一款想玩的游戏</h2>
      <div className="mt-5 flex w-full flex-col gap-2 text-left">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onPrompt(prompt)} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:border-primary/50 hover:bg-primary/5 hover:text-text">
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SourceList({ sources }: { sources: Array<{ kind: string; title: string; url: string; description: string }> }) {
  return (
    <div className="mt-2 w-full max-w-[88%] space-y-1.5">
      {sources.map((source) => (
        <Link key={source.url} to={source.url} className="flex items-center gap-2 rounded-md border border-border bg-white px-2.5 py-2 text-left text-xs hover:border-primary/60 hover:bg-primary/5">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate font-semibold text-text">{source.title}</span>
          <span className="shrink-0 text-text-secondary">{source.kind === 'game' ? '游戏' : '帖子'}</span>
        </Link>
      ))}
    </div>
  )
}
