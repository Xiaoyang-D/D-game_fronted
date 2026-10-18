// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { imageSource, preparePostImages } from '@/lib/images'
import { OptimizedImage } from './OptimizedImage'
import { PostContent } from './PostContent'

const original = 'https://dgame.test/files/original.jpg'
const thumbnail = 'https://dgame.test/files/_variants/thumb.jpg'
const preview = 'https://dgame.test/files/_variants/preview.jpg'
const images = [{ originalUrl: original, thumbnailUrl: thumbnail, previewUrl: preview }]
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open') } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  vi.unstubAllGlobals()
})

describe('post image variants', () => {
  it('selects only metadata belonging to the requested original, with old API fallback', () => {
    expect(imageSource(original, images, 'thumbnail')).toBe(thumbnail)
    expect(imageSource(original, images, 'preview')).toBe(preview)
    expect(imageSource(original, undefined, 'thumbnail')).toBe(original)
    expect(imageSource('https://external.test/a.png', images, 'preview')).toBe('https://external.test/a.png')
  })

  it('preserves text order, mentions and existing links while replacing every inline image', () => {
    const content = `<p>Before<img src="${original}" alt="shot">After</p><p><a href="https://external.test"><img src="${original}"></a><span data-type="mention" data-id="42">user</span></p>`
    const document = new DOMParser().parseFromString(preparePostImages(content, images), 'text/html')
    const pictures = document.querySelectorAll('img')
    expect(Array.from(pictures).map(image => image.getAttribute('src'))).toEqual([preview, preview])
    expect(pictures[0].getAttribute('loading')).toBe('eager')
    expect(pictures[1].getAttribute('loading')).toBe('lazy')
    expect(document.querySelector('p')?.textContent).toBe('BeforeAfter')
    expect(document.querySelectorAll('[data-image-original]')).toHaveLength(1)
    expect(document.querySelector('a[href="https://external.test"]')).not.toBeNull()
    expect(document.querySelector('[data-id="42"]')?.textContent).toBe('user')
  })

  it('does not mount the original image until the user opens it, then closes the dialog', async () => {
    await act(() => root.render(<PostContent content={`<p><img src="${original}"></p>`} images={images} />))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(preview)
    expect(container.querySelector('dialog')).toBeNull()
    await act(() => (container.querySelector('[data-image-original]') as HTMLAnchorElement).click())
    expect(container.querySelector('dialog[open] img')?.getAttribute('src')).toBe(original)
    await act(() => (container.querySelector('[aria-label="关闭原图"]') as HTMLButtonElement).click())
    expect(container.querySelector('dialog')).toBeNull()
    expect(document.activeElement?.getAttribute('data-image-original')).toBe(original)
  })

  it('falls back once when a preview is missing and keeps mention clicks working', async () => {
    const clicked = vi.fn()
    await act(() => root.render(<PostContent content={`<p><img src="${original}"><span data-type="mention" data-id="42">user</span></p>`} images={images} onClick={clicked} />))
    const image = container.querySelector('img')!
    await act(() => image.dispatchEvent(new Event('error')))
    expect(image.getAttribute('src')).toBe(original)
    await act(() => image.dispatchEvent(new Event('error')))
    expect(image.getAttribute('src')).toBe(original)
    await act(() => (container.querySelector('[data-id="42"]') as HTMLElement).click())
    expect(clicked).toHaveBeenCalledOnce()
  })

  it('recovers a failed card thumbnail and selects the next posts new source', async () => {
    await act(() => root.render(<OptimizedImage originalUrl={original} source={thumbnail} alt="" />))
    await act(() => container.querySelector('img')!.dispatchEvent(new Event('error')))
    expect(container.querySelector('img')?.getAttribute('src')).toBe(original)
    await act(() => root.render(<OptimizedImage originalUrl="/next.jpg" source="/next.thumb.jpg" alt="" />))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/next.thumb.jpg')
  })
})
