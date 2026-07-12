import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { getNotifications, markAllAsRead, markAsRead } from '@/api/notification'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime, getNotificationTypeLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const size = 15
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications({ page, size }),
  })

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      toast('已全部标记为已读')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">通知中心</h1>
          <p className="mt-1 text-sm text-text-secondary">查看你的互动和系统通知</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => readAllMutation.mutate()}
          loading={readAllMutation.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          全部已读
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Loading />
        ) : data && data.records.length > 0 ? (
          <>
            <div className="flex flex-col gap-2">
              {data.records.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'cursor-pointer transition-colors duration-200',
                    notification.isRead === 0 && 'border-primary/30 bg-primary/5',
                  )}
                  onClick={() => {
                    if (notification.isRead === 0) {
                      readMutation.mutate(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {notification.isRead === 0 && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <h3 className="mt-1 font-medium text-text">{notification.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{notification.content}</p>
                      <p className="mt-2 text-xs text-text-secondary">
                        {formatDateTime(notification.gmtCreate)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={page} size={size} total={data.total} onChange={setPage} />
          </>
        ) : (
          <Empty title="暂无通知" />
        )}
      </div>
    </div>
  )
}
