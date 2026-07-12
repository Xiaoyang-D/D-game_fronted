import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  page: number
  size: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, size, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size))

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="上一页"
      >
        <ChevronLeft className="h-4 w-4" />
        上一页
      </Button>
      <span className="text-sm text-text-secondary">
        第 {page} / {totalPages} 页，共 {total} 条
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="下一页"
      >
        下一页
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
