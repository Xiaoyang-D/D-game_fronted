import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageVariantsResp } from '@/types/api'
import { imageSource } from '@/lib/images'
import { OptimizedImage } from './OptimizedImage'
import { OriginalImageDialog } from './OriginalImageDialog'

export function PostImageGallery({ content, images: variants }: { content: string; images?: ImageVariantsResp[] }) {
  const images = useMemo(() => {
    const document = new DOMParser().parseFromString(content, 'text/html')
    return Array.from(document.querySelectorAll('img')).map(image => ({ src: image.getAttribute('src') || '', alt: image.getAttribute('alt') || '帖子图片' })).filter(image => image.src)
  }, [content])
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState<HTMLElement | null>(null)
  const current = Math.min(index, Math.max(0, images.length - 1))
  if (!images.length) return null
  function move(direction: number) { setIndex((current + direction + images.length) % images.length) }
  return <section aria-label="帖子图片浏览" className="mb-6">
    <div className="relative flex h-[420px] items-center justify-center rounded-lg bg-white sm:h-[740px]">
      <button type="button" aria-label="查看完整图片" onClick={event => setExpanded(event.currentTarget)} className="h-full w-full"><OptimizedImage originalUrl={images[current].src} source={imageSource(images[current].src, variants, 'preview')} alt={images[current].alt} loading="eager" className="mx-auto h-full max-w-full object-contain" /></button>
      <span className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white">{current + 1}/{images.length}</span>
      <button type="button" onClick={event => setExpanded(event.currentTarget)} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white">查看完整图片</button>
    </div>
    {images.length > 1 && <div className="mt-3 flex items-center gap-2">
      <button aria-label="上一张图片" onClick={() => move(-1)} className="shrink-0 rounded-full bg-muted p-1"><ChevronLeft className="h-5 w-5" /></button>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{images.map((image, item) => <button key={`${image.src}-${item}`} aria-label={`查看第 ${item + 1} 张图片`} aria-pressed={current === item} onClick={() => setIndex(item)} className={`h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 ${current === item ? 'border-primary' : 'border-transparent'}`}><OptimizedImage originalUrl={image.src} source={imageSource(image.src, variants, 'thumbnail')} alt="" className="h-full w-full object-cover" /></button>)}</div>
      <button aria-label="下一张图片" onClick={() => move(1)} className="shrink-0 rounded-full bg-muted p-1"><ChevronRight className="h-5 w-5" /></button>
    </div>}
    {expanded && <OriginalImageDialog src={images[current].src} alt={images[current].alt} returnFocus={expanded} onClose={() => setExpanded(null)} />}
  </section>
}
