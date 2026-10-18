// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroCarousel, type HeroSlide } from './HomePage'

const slides: HeroSlide[] = ['first', 'second', 'third'].map(name => ({
  image: `/${name}.jpg`, imageAlt: name, eyebrow: name, title: name, description: name,
  primaryLabel: '进入', primaryTo: '/community', secondaryLabel: '讨论', secondaryTo: '/community',
}))
let root: Root
let container: HTMLDivElement
let preloaded: string[]
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestIdleCallback', undefined)
  preloaded = []
  vi.stubGlobal('Image', class {
    set src(value: string) { preloaded.push(value) }
  })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(() => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
const pictures = () => Array.from(container.querySelectorAll('img')).map(image => image.getAttribute('src'))
async function render(value = slides) {
  await act(() => root.render(<MemoryRouter><HeroCarousel slides={value} /></MemoryRouter>))
}

describe('carousel image loading', () => {
  it('loads only the active image first and preloads just the next image after it settles', async () => {
    await render()
    expect(pictures()).toEqual(['/first.jpg'])
    expect(preloaded).toEqual([])
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('load')))
    await act(() => vi.advanceTimersByTime(600))
    expect(preloaded).toEqual(['/second.jpg'])
    expect(pictures()).toEqual(['/first.jpg'])
    await act(() => (container.querySelector('[aria-label="下一张轮播图"]') as HTMLButtonElement).click())
    expect(pictures()).toEqual(['/first.jpg', '/second.jpg'])
    await act(() => container.querySelector('img[src="/second.jpg"]')!.dispatchEvent(new Event('load')))
    await act(() => vi.advanceTimersByTime(600))
    expect(preloaded).toEqual(['/second.jpg', '/third.jpg'])
  })

  it('supports manual skips and shrinking or empty slide lists', async () => {
    await render()
    await act(() => (container.querySelector('[aria-label="切换到第 3 张轮播图"]') as HTMLButtonElement).click())
    expect(pictures()).toEqual(['/third.jpg'])
    await act(() => (container.querySelector('[aria-label="上一张轮播图"]') as HTMLButtonElement).click())
    expect(pictures()).toEqual(['/second.jpg'])
    await render(slides.slice(0, 1))
    expect(pictures()).toEqual(['/first.jpg'])
    await render([])
    expect(container.querySelector('section')).toBeNull()
  })

  it('waits for a slow current image before auto-rotation and recovers after an image error', async () => {
    await render()
    await act(() => vi.advanceTimersByTime(10000))
    expect(pictures()).toEqual(['/first.jpg'])
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('error')))
    await act(() => vi.advanceTimersByTime(5000))
    expect(pictures()).toEqual(['/first.jpg', '/second.jpg'])
  })

  it('cancels a queued preload when unmounted', async () => {
    await render()
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('load')))
    await render([])
    await act(() => vi.advanceTimersByTime(2000))
    expect(preloaded).toEqual([])
  })
})
