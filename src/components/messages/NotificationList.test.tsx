import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { NotificationList } from './NotificationList'
import type { Notification, PageResult } from '@/types/api'

vi.mock('./MessageProvider', () => ({ useMessageConnection: () => false }))

describe('unavailable moderation notification targets', () => {
  it('keeps the rejection reason visible when the reviewed content cannot be opened', () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
    client.setQueryData<PageResult<Notification>>(['notifications', 'system', 1], {
      page: 1, size: 15, total: 1,
      records: [{ id: '1', receiverId: '2', senderId: '0', type: 5, title: '内容审核未通过', content: '原因：请移除广告', targetType: 1, targetId: '3', targetAvailable: false, isRead: 0, gmtCreate: '', gmtModified: '', isDeleted: 0 }],
    })
    const html = renderToStaticMarkup(<QueryClientProvider client={client}><MemoryRouter><ToastProvider><NotificationList category="system" /></ToastProvider></MemoryRouter></QueryClientProvider>)
    expect(html).toContain('原因：请移除广告')
    expect(html).toContain('关联内容已删除或暂不可见')
    client.clear()
  })
})
