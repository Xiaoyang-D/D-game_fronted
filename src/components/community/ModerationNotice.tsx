import type { ModerationView } from '@/types/api'
import { moderationStatusLabel } from '@/lib/moderation'

export function ModerationNotice({ moderation, hasPublishedVersion = false, scheduledPublishAt }: { moderation?: ModerationView | null; hasPublishedVersion?: boolean; scheduledPublishAt?: string | null }) {
  if (!moderation || !['PENDING', 'REJECTED'].includes(moderation.status)) return null
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${moderation.status === 'REJECTED' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
    <p className="font-semibold">{moderationStatusLabel(moderation.status)}{hasPublishedVersion ? ' · 原版本仍公开' : ''}</p>
    <p className="mt-1">{moderation.reason || (moderation.status === 'PENDING' ? '内容需要人工审核，通过后公开。' : '请修改内容后重新提交。')}</p>
    {scheduledPublishAt && moderation.status === 'PENDING' && <p className="mt-1">定时内容最早按设定时间公开，到期仍待审时延后发布。</p>}
  </div>
}
