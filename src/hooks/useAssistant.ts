import { useContext } from 'react'
import { AssistantContext, type AssistantContextValue } from '@/components/assistant/assistantContext'

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext)
  if (!context) throw new Error('useAssistant must be used inside AssistantProvider')
  return context
}
