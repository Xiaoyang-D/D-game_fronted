import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { X } from 'lucide-react'
import { getNotificationSettings, saveNotificationSettings } from '@/api/notification'
import { useToast } from '@/components/ui/Toast'
import type { NotificationSettings } from '@/types/messages'
/** 保存期间展示本次选择，失败恢复已保存值，再从服务端核对最终状态。 */
export function MessageSettings({ onClose }: { onClose: () => void }) {
  const client = useQueryClient()
  const { toast } = useToast()
  const [pendingSettings, setPendingSettings] = useState<NotificationSettings | null>(null)
  const query = useQuery({ queryKey: ['notification-settings'], queryFn: getNotificationSettings })
  const save = useMutation({
    mutationFn: saveNotificationSettings,
    onMutate: async next => {
      // 取消旧查询，防止其迟到响应覆盖刚提交的开关；保存原值供失败回滚。
      await client.cancelQueries({ queryKey: ['notification-settings'] })
      const previous = client.getQueryData<NotificationSettings>(['notification-settings'])
      client.setQueryData(['notification-settings'], next)
      return { previous }
    },
    onSuccess: (_result, next) => { client.setQueryData(['notification-settings'], next); toast('消息设置已保存') },
    onError: (error: Error, _next, context) => { if (context?.previous) client.setQueryData(['notification-settings'], context.previous); toast(error.message, 'error') },
    onSettled: async () => { await client.invalidateQueries({ queryKey: ['notification-settings'] }); setPendingSettings(null) },
  })
  const values = pendingSettings || query.data
  const options: Array<[keyof NotificationSettings, string]> = [['replies', '回复提醒'], ['mentions', '@我的提醒'], ['likes', '点赞提醒'], ['social', '关注与好友提醒']]
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}><section role="dialog" aria-modal="true" aria-label="消息设置" onClick={event => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><header className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold">消息设置</h2><button type="button" aria-label="关闭消息设置" onClick={onClose}><X className="h-5 w-5" /></button></header>
    {query.isError ? <button type="button" onClick={() => void query.refetch()}>加载失败，点击重试</button> : !values ? <p>加载中…</p> : options.map(([key, label]) => <label key={key} className="flex items-center justify-between py-3 text-sm"><span>{label}</span><input type="checkbox" checked={values[key]} disabled={save.isPending} onChange={event => { const next = { ...values, [key]: event.target.checked }; setPendingSettings(next); save.mutate(next) }} className="h-4 w-4 accent-primary" /></label>)}
    <p className="mt-4 text-xs leading-6 text-gray-400">关闭后新通知仍会保存，但不提醒、不计入未读数。私信、系统与审核消息始终保留。</p>
  </section></div>
}
