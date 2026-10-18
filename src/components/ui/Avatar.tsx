import { User } from 'lucide-react'
import { useState } from 'react'
import { avatarSources } from '@/lib/avatars'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}

export function Avatar({ src, alt = '用户头像', size = 'md', className }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>()
  const [failedOriginal, setFailedOriginal] = useState<string>()
  const { source, original } = avatarSources(src || '', size)
  const displayed = failedSource === source ? original : source
  if (src && failedOriginal !== original) {
    return (
      <img
        src={displayed}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (displayed !== original) setFailedSource(source)
          else setFailedOriginal(original)
        }}
        alt={alt}
        className={cn('rounded-full object-cover border border-border', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted text-text-secondary border border-border',
        sizes[size],
        className,
      )}
      aria-label={alt}
    >
      <User className="h-1/2 w-1/2" />
    </div>
  )
}
