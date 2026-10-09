export interface AssistantSource {
  kind: 'game' | 'post'
  title: string
  url: string
  description: string
}

export interface AssistantMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  sources: AssistantSource[]
  createdAt: string
}

export interface ConversationCredentials {
  id: string
  key: string
}

type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'sources'; items: AssistantSource[] }
  | { type: 'done'; conversationId: string }
  | { type: 'error'; message: string }

const AGENT_API_BASE_URL = (import.meta.env.VITE_AGENT_API_BASE_URL || '/agent-api/v1').replace(/\/$/, '')

export class AgentApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AgentApiError'
    this.status = status
  }
}

export async function getConversation(credentials: ConversationCredentials, signal?: AbortSignal): Promise<AssistantMessage[]> {
  const response = await fetch(`${AGENT_API_BASE_URL}/conversations/${credentials.id}`, {
    headers: { 'X-Conversation-Key': credentials.key },
    signal,
  })
  if (!response.ok) throw await responseError(response)
  const payload = (await response.json()) as { messages: Array<{ id: number; role: 'user' | 'assistant'; content: string; sources: AssistantSource[]; created_at: string }> }
  return payload.messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    sources: message.sources,
    createdAt: message.created_at,
  }))
}

export async function deleteConversation(credentials: ConversationCredentials): Promise<void> {
  const response = await fetch(`${AGENT_API_BASE_URL}/conversations/${credentials.id}`, {
    method: 'DELETE',
    headers: { 'X-Conversation-Key': credentials.key },
  })
  if (!response.ok && response.status !== 404) throw await responseError(response)
}

export async function streamAssistantChat(
  credentials: ConversationCredentials,
  message: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${AGENT_API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Conversation-Key': credentials.key,
    },
    body: JSON.stringify({ conversation_id: credentials.id, message }),
    signal,
  })
  if (!response.ok) throw await responseError(response)
  if (!response.body) throw new AgentApiError('助手服务没有返回流式响应')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''
      blocks.forEach((block) => dispatchSseBlock(block, onEvent))
      if (done) break
    }
    if (buffer.trim()) dispatchSseBlock(buffer, onEvent)
  } finally {
    reader.releaseLock()
  }
}

async function responseError(response: Response): Promise<AgentApiError> {
  try {
    const payload = (await response.json()) as { detail?: string }
    return new AgentApiError(payload.detail || '助手服务请求失败', response.status)
  } catch {
    return new AgentApiError('助手服务请求失败', response.status)
  }
}

function dispatchSseBlock(block: string, onEvent: (event: StreamEvent) => void): void {
  const type = block.match(/^event:\s*(.+)$/m)?.[1]
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n')
  if (!type || !data) return

  try {
    const payload = JSON.parse(data) as Record<string, unknown>
    if (type === 'delta' && typeof payload.text === 'string') onEvent({ type, text: payload.text })
    if (type === 'sources' && Array.isArray(payload.items)) onEvent({ type, items: payload.items as AssistantSource[] })
    if (type === 'done' && typeof payload.conversation_id === 'string') onEvent({ type, conversationId: payload.conversation_id })
    if (type === 'error' && typeof payload.message === 'string') onEvent({ type, message: payload.message })
  } catch {
    // Ignore incomplete or malformed events; the server emits a terminal error for request failures.
  }
}
