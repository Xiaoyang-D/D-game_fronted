import { useCallback, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import {
  AgentApiError,
  type AssistantMessage,
  type ConversationCredentials,
  deleteConversation,
  getConversation,
  streamAssistantChat,
} from '@/api/agent'
import { AssistantContext } from './assistantContext'

const STORAGE_KEY = 'd_game_assistant_conversation'

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<ConversationCredentials>(readCredentials)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortController = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    void getConversation(credentials, controller.signal)
      .then((history) => {
        if (active) setMessages(history)
      })
      .catch((cause: unknown) => {
        if (!active || isAbort(cause)) return
        if (cause instanceof AgentApiError && cause.status === 404) return
        setError('无法加载历史对话，请稍后重试。')
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [credentials])

  useEffect(() => () => abortController.current?.abort(), [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const stop = useCallback(() => abortController.current?.abort(), [])

  const startNewConversation = useCallback(() => {
    abortController.current?.abort()
    const next = createCredentials()
    saveCredentials(next)
    setCredentials(next)
    setMessages([])
    setIsLoadingHistory(true)
    setError(null)
  }, [])

  const clearConversation = useCallback(async () => {
    abortController.current?.abort()
    try {
      await deleteConversation(credentials)
    } catch {
      setError('无法清空历史对话，请稍后重试。')
      return
    }
    const next = createCredentials()
    saveCredentials(next)
    setCredentials(next)
    setMessages([])
    setIsLoadingHistory(true)
    setError(null)
  }, [credentials])

  const send = useCallback(
    async (rawMessage: string) => {
      const content = rawMessage.trim()
      if (!content || isStreaming) return
      const userMessage: AssistantMessage = {
        id: `user-${crypto.randomUUID()}`,
        role: 'user',
        content,
        sources: [],
        createdAt: new Date().toISOString(),
      }
      const assistantId = `assistant-${crypto.randomUUID()}`
      const assistantMessage: AssistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        sources: [],
        createdAt: new Date().toISOString(),
      }
      const controller = new AbortController()
      abortController.current = controller
      setMessages((current) => [...current, userMessage, assistantMessage])
      setError(null)
      setIsStreaming(true)
      try {
        await streamAssistantChat(
          credentials,
          content,
          (event) => {
            if (event.type === 'delta') {
              updateAssistantMessage(setMessages, assistantId, (message) => ({ ...message, content: message.content + event.text }))
            }
            if (event.type === 'sources') {
              updateAssistantMessage(setMessages, assistantId, (message) => ({ ...message, sources: event.items }))
            }
            if (event.type === 'error') setError(event.message)
          },
          controller.signal,
        )
      } catch (cause) {
        if (!isAbort(cause)) setError(cause instanceof Error ? cause.message : '助手服务暂时不可用。')
      } finally {
        if (abortController.current === controller) abortController.current = null
        setIsStreaming(false)
      }
    },
    [credentials, isStreaming],
  )

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        messages,
        isLoadingHistory,
        isStreaming,
        error,
        open,
        close,
        send,
        stop,
        startNewConversation,
        clearConversation,
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}

function updateAssistantMessage(
  setMessages: Dispatch<SetStateAction<AssistantMessage[]>>,
  assistantId: string,
  update: (message: AssistantMessage) => AssistantMessage,
): void {
  setMessages((current) => current.map((message) => (message.id === assistantId ? update(message) : message)))
}

function readCredentials(): ConversationCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as ConversationCredentials
      if (saved.id && saved.key && saved.key.length >= 32) return saved
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  const credentials = createCredentials()
  saveCredentials(credentials)
  return credentials
}

function createCredentials(): ConversationCredentials {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return { id: crypto.randomUUID(), key }
}

function saveCredentials(credentials: ConversationCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

function isAbort(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}
