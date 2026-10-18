import type { ImageVariantsResp } from '@/types/api'

export function postTextWithoutImages(content: string): string {
  const document = new DOMParser().parseFromString(content, 'text/html')
  document.querySelectorAll('img').forEach(image => image.remove())
  return document.body.innerHTML
}

export function imageSource(originalUrl: string, images: ImageVariantsResp[] | undefined, variant: 'thumbnail' | 'preview'): string {
  const image = images?.find(item => item.originalUrl === originalUrl)
  return (variant === 'thumbnail' ? image?.thumbnailUrl : image?.previewUrl) || originalUrl
}

/** Parse in a detached document: original image URLs never enter the visible page before replacement. */
export function preparePostImages(content: string, images?: ImageVariantsResp[]): string {
  const document = new DOMParser().parseFromString(content, 'text/html')
  document.querySelectorAll('img').forEach((image, index) => {
    const original = image.getAttribute('src') || ''
    if (!original) return
    image.setAttribute('src', imageSource(original, images, 'preview'))
    image.setAttribute('loading', index === 0 ? 'eager' : 'lazy')
    image.setAttribute('decoding', 'async')
    image.setAttribute('data-original-src', original)
    // Preserve an author's explicit image link. Other images get a keyboard-accessible original viewer.
    if (!image.closest('a')) {
      const link = document.createElement('a')
      link.href = original
      link.setAttribute('data-image-original', original)
      link.setAttribute('aria-label', '查看原图')
      link.className = 'cursor-zoom-in'
      image.replaceWith(link)
      link.append(image)
    }
  })
  return document.body.innerHTML
}
