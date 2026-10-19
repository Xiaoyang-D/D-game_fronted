import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllAsRead, markAsRead } from '@/api/notification'
import { Avatar } from '@/components/ui/Avatar'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/utils'
import { useMessageConnection } from './MessageProvider'
import type { NotificationCategory } from '@/types/messages'

export function NotificationList({ category }: { category: NotificationCategory }) {
  const [page, setPage] = useState(1)
  const client = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const connected = useMessageConnection()
  const query = useQuery({ queryKey: ['notifications', category, page], queryFn: () => getNotifications({ page, size: 15, category }), refetchInterval: connected ? false : 30000 })
  const refresh = async () => { await Promise.all(['notifications', 'message-summary'].map(key => client.invalidateQueries({ queryKey: [key] }))) }
  const read = useMutation({ mutationFn: markAsRead, onSuccess: refresh, onError: (error: Error) => toast(error.message, 'error') })
  const readAll = useMutation({ mutationFn: () => markAllAsRead(category), onSuccess: refresh, onError: (error: Error) => toast(error.message, 'error') })
  return <div className="p-4 sm:p-6">
    <div className="mb-4 flex justify-end"><button type="button" disabled={readAll.isPending} onClick={() => readAll.mutate()} className="text-xs text-gray-400 hover:text-primary">本类全部已读</button></div>
    {query.isPending ? <p className="py-20 text-center text-sm text-gray-400">加载消息…</p> : query.isError ? <button type="button" onClick={() => void query.refetch()} className="w-full py-20 text-center text-red-500">加载失败，点击重试</button> : !query.data?.records.length ? <p className="py-20 text-center text-sm text-gray-400">暂时没有消息</p> : <>
      {query.data.records.map(notification => <button key={notification.id} type="button" onClick={() => {
        if (notification.isRead === 0) read.mutate(notification.id)
        if (notification.targetAvailable === false) toast('内容已删除或暂不可见', 'error')
        else if (notification.targetUrl) navigate(notification.targetUrl)
      }} className="flex w-full items-start gap-3 border-b border-gray-100 py-5 text-left hover:bg-gray-50">
        <Avatar src={notification.senderAvatarUrl} alt={notification.senderNickname || '通知'} size="md" />
        <div className="min-w-0 flex-1"><p className="font-medium text-gray-800">{notification.senderNickname || notification.title}<span className="ml-2 text-xs font-normal text-gray-400">{notification.senderNickname ? notification.title : ''}</span></p><p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{notification.content}</p>{notification.targetAvailable === false && <p className="mt-1 text-xs text-gray-400">关联内容已删除或暂不可见</p>}<p className="mt-2 text-xs text-gray-400">{formatDateTime(notification.gmtCreate)}</p></div>
        {notification.isRead === 0 && notification.isSilent !== 1 && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </button>)}
      <Pagination page={page} size={15} total={query.data.total} onChange={setPage} />
    </>}
  </div>
}
