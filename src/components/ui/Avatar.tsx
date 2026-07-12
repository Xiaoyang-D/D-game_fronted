import { User } from 'lucide-react'
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
  if (src) {
    return (
      <img
        src={src}
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
