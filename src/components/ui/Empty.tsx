import { Inbox } from 'lucide-react'

export function Empty({ title = '暂无数据', description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-secondary">
      <Inbox className="h-10 w-10 text-border" aria-hidden="true" />
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  )
}
