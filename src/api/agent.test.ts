import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamAssistantChat } from './agent'

afterEach(() => vi.unstubAllGlobals())

describe('streamAssistantChat', () => {
  it('parses delta, sources, and done SSE events', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: delta\ndata: {"text":"你好"}\n\nevent: sources\ndata: {"items":[{"kind":"game","title":"示例","url":"/games/1","description":""}]}\n\nevent: done\ndata: {"conversation_id":"thread-1"}\n\n'))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })))
    const events: string[] = []

    await streamAssistantChat({ id: 'thread-1', key: 'a'.repeat(64) }, '你好', (event) => events.push(event.type))

    expect(events).toEqual(['delta', 'sources', 'done'])
  })
})
