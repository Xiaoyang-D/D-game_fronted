import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function postTextWithoutImages(content: string): string {
  const document = new DOMParser().parseFromString(content, 'text/html')
  document.querySelectorAll('img').forEach(image => image.remove())
  return document.body.innerHTML
}

export function PostImageGallery({ content }: { content: string }) {
  const images = useMemo(() => {
    const document = new DOMParser().parseFromString(content, 'text/html')
    return Array.from(document.querySelectorAll('img')).map(image => ({ src: image.getAttribute('src') || '', alt: image.getAttribute('alt') || '帖子图片' })).filter(image => image.src)
  }, [content])
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const current = Math.min(index, Math.max(0, images.length - 1))
  useEffect(() => {
    if (!expanded) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [expanded])
  if (!images.length) return null
  function move(direction: number) { setIndex((current + direction + images.length) % images.length) }
  return <section aria-label="帖子图片浏览" className="mb-6">
    <div className="relative flex h-[420px] items-center justify-center rounded-lg bg-white sm:h-[740px]">
      <button type="button" aria-label="查看完整图片" onClick={() => setExpanded(true)} className="h-full w-full"><img src={images[current].src} alt={images[current].alt} className="mx-auto h-full max-w-full object-contain" /></button>
      <span className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white">{current + 1}/{images.length}</span>
      <button type="button" onClick={() => setExpanded(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white">查看完整图片</button>
    </div>
    {images.length > 1 && <div className="mt-3 flex items-center gap-2">
      <button aria-label="上一张图片" onClick={() => move(-1)} className="shrink-0 rounded-full bg-muted p-1"><ChevronLeft className="h-5 w-5" /></button>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{images.map((image, item) => <button key={`${image.src}-${item}`} aria-label={`查看第 ${item + 1} 张图片`} aria-pressed={current === item} onClick={() => setIndex(item)} className={`h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 ${current === item ? 'border-primary' : 'border-transparent'}`}><img src={image.src} alt="" className="h-full w-full object-cover" /></button>)}</div>
      <button aria-label="下一张图片" onClick={() => move(1)} className="shrink-0 rounded-full bg-muted p-1"><ChevronRight className="h-5 w-5" /></button>
    </div>}
    {expanded && <div role="dialog" aria-modal="true" aria-label="完整图片" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-5" onClick={() => setExpanded(false)}>
      <button autoFocus aria-label="关闭完整图片" onClick={() => setExpanded(false)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white"><X /></button>
      <img src={images[current].src} alt={images[current].alt} className="max-h-[90vh] max-w-full object-contain" onClick={event => event.stopPropagation()} />
    </div>}
  </section>
}
