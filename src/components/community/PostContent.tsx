import { useMemo, useState, type MouseEventHandler } from 'react'
import type { ImageVariantsResp } from '@/types/api'
import { preparePostImages } from '@/lib/images'
import { OriginalImageDialog } from './OriginalImageDialog'

interface PostContentProps {
  content: string
  images?: ImageVariantsResp[]
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function PostContent({ content, images, className, onClick }: PostContentProps) {
  const markup = useMemo(() => ({ __html: preparePostImages(content, images) }), [content, images])
  const [original, setOriginal] = useState<{ src: string; opener: HTMLElement | null }>()
  return <>
    <div className={className} dangerouslySetInnerHTML={markup} onClick={event => {
      const link = (event.target as HTMLElement).closest('[data-image-original]')
      const src = link?.getAttribute('data-image-original')
      if (src) {
        event.preventDefault()
        if (link instanceof HTMLElement) link.focus({ preventScroll: true })
        setOriginal({ src, opener: link instanceof HTMLElement ? link : null })
      } else {
        onClick?.(event)
      }
    }} onErrorCapture={event => {
      if (!(event.target instanceof HTMLImageElement)) return
      const image = event.target
      const src = image.getAttribute('data-original-src')
      if (src && image.getAttribute('src') !== src) image.setAttribute('src', src)
    }} />
    {original && <OriginalImageDialog src={original.src} returnFocus={original.opener} onClose={() => setOriginal(undefined)} />}
  </>
}
