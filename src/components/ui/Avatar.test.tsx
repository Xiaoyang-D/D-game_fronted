// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Avatar } from './Avatar'

const key = '2026/10/18/0123456789abcdef0123456789abcdef.png'
const original = `/files/${key}`
const large = `/files/_variants/v1/${key}.avatar256.png`
const small = `/files/_variants/v1/${key}.avatar128.png`
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => { await act(() => root.unmount()); vi.unstubAllGlobals() })

describe('avatar variants', () => {
  it('selects small and large variants and preserves legacy or external URLs', async () => {
    await act(() => root.render(<Avatar src={large} size="sm" />))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(small)
    expect(container.querySelector('img')?.getAttribute('loading')).toBe('lazy')
    await act(() => root.render(<Avatar src={large} size="lg" />))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(large)
    for (const url of [original, 'https://external.test/avatar.gif']) {
      await act(() => root.render(<Avatar src={url} />))
      expect(container.querySelector('img')?.getAttribute('src')).toBe(url)
    }
  })

  it('falls back to the original once, then placeholder, and recovers for a new avatar', async () => {
    await act(() => root.render(<Avatar src={large} />))
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('error')))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(original)
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('error')))
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[aria-label="用户头像"]')).not.toBeNull()
    await act(() => root.render(<Avatar src="/new-avatar.jpg" />))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/new-avatar.jpg')
  })
})
