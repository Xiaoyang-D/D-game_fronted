import { createContext } from 'react'
import type { AssistantMessage } from '@/api/agent'

export interface AssistantContextValue {
  isOpen: boolean
  messages: AssistantMessage[]
  isLoadingHistory: boolean
  isStreaming: boolean
  error: string | null
  open: () => void
  close: () => void
  send: (message: string) => Promise<void>
  stop: () => void
  startNewConversation: () => void
  clearConversation: () => Promise<void>
}

export const AssistantContext = createContext<AssistantContextValue | null>(null)
