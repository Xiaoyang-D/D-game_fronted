import { Loader2 } from 'lucide-react'

export function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-secondary">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
