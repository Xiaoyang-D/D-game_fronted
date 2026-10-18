import { useState, type ImgHTMLAttributes } from 'react'

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  originalUrl: string
  source: string
}

/** A removed or unavailable derivative falls back once, without an error-request loop. */
export function OptimizedImage({ originalUrl, source, loading = 'lazy', decoding = 'async', ...props }: OptimizedImageProps) {
  const [failedSource, setFailedSource] = useState<string>()
  const src = failedSource === source ? originalUrl : source
  return <img {...props} src={src} loading={loading} decoding={decoding}
    onError={() => { if (src !== originalUrl) setFailedSource(source) }} />
}
