import { afterEach, describe, expect, it, vi } from 'vitest'
import { randomUuid } from './randomUuid'

afterEach(() => vi.unstubAllGlobals())

describe('randomUuid', () => {
  it('works when HTTP does not expose randomUUID, preserving UUID v4 bits', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(255)
      return bytes
    })
    vi.stubGlobal('crypto', { getRandomValues })
    expect(randomUuid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
    expect(getRandomValues).toHaveBeenCalledOnce()
  })

  it('uses the native implementation when available', () => {
    const native = vi.fn(() => '12345678-1234-4567-8123-123456789abc')
    vi.stubGlobal('crypto', { randomUUID: native })
    expect(randomUuid()).toBe('12345678-1234-4567-8123-123456789abc')
    expect(native).toHaveBeenCalledOnce()
  })
})
