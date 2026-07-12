import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

export function RatingStars({ value, max = 10, onChange, size = 'md' }: RatingStarsProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors duration-200',
            onChange ? 'cursor-pointer hover:scale-105' : 'cursor-default',
          )}
          aria-label={`评分 ${star}`}
        >
          <Star
            className={cn(
              iconSize,
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
            )}
          />
        </button>
      ))}
    </div>
  )
}
