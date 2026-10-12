import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronRight, Settings, Users, X } from 'lucide-react'
import { getConversation, getConversations, getFriends, getUnreadSummary, openConversation } from '@/api/message'
import { Avatar } from '@/components/ui/Avatar'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { ChatPanel } from '@/components/messages/ChatPanel'
import { NotificationList } from '@/components/messages/NotificationList'
import { MessageSettings } from '@/components/messages/MessageSettings'
import { useMessageConnection } from '@/components/messages/MessageProvider'
import { cn, formatDateTime } from '@/lib/utils'

const tabs = [{ key: 'chats', label: '聊天列表' }, { key: 'replies', label: '回复我的' }, { key: 'mentions', label: '@我的' }, { key: 'likes', label: '收到的赞' }] as const

/** 页签和会话保存在查询参数中，桌面并列展示，移动端独立进入会话。 */
export function NotificationsPage() {
  const [params, setParams] = useSearchParams()
  const client = useQueryClient()
  const [settings, setSettings] = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [friendsPage, setFriendsPage] = useState(1)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const tab = tabs.some(item => item.key === params.get('tab')) ? params.get('tab')! : 'chats'
  const conversationId = tab === 'chats' ? params.get('conversation') : null
  const channel = tab === 'chats' && ['system', 'social'].includes(params.get('channel') || '') ? params.get('channel') : null
  const page = Math.max(1, Number(params.get('page')) || 1)
  const connected = useMessageConnection()
  const { toast } = useToast()
  const summary = useQuery({ queryKey: ['message-summary'], queryFn: getUnreadSummary, refetchInterval: connected ? false : 30000 })
  const chats = useQuery({ queryKey: ['conversations', page], queryFn: () => getConversations(page), enabled: tab === 'chats', refetchInterval: connected ? false : 30000 })
  const selected = useQuery({ queryKey: ['conversations', 'detail', conversationId], queryFn: () => getConversation(conversationId!), enabled: !!conversationId, refetchInterval: connected ? false : 5000 })
  const friends = useQuery({ queryKey: ['friends', friendsPage, deferredSearch], queryFn: () => getFriends(friendsPage, deferredSearch), enabled: friendsOpen, refetchInterval: connected ? false : 30000 })
  const open = useMutation({ mutationFn: openConversation, onSuccess: async conversation => { setFriendsOpen(false); setParams({ tab: 'chats', conversation: conversation.id }); await client.invalidateQueries({ queryKey: ['conversations'] }) }, onError: (error: Error) => toast(error.message, 'error') })
  const count = (key: string) => key === 'chats' ? (summary.data?.privateMessages || 0) + (summary.data?.system || 0) + (summary.data?.social || 0) : summary.data?.[key as 'replies' | 'mentions' | 'likes'] || 0
  const badge = (value: number) => value > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">{value > 99 ? '99+' : value}</span>
  const back = () => setParams({ tab: 'chats' })
  const selectedContent = !!conversationId || !!channel
  return <div className="mx-auto max-w-5xl rounded-2xl bg-white px-5 py-6 shadow-sm sm:px-8">
    <header className="flex items-center justify-between"><h1 className="text-[28px] font-normal tracking-wide text-gray-900">消息</h1><button type="button" aria-label="消息设置" onClick={() => setSettings(true)} className="p-2 text-gray-900"><Settings className="h-6 w-6" /></button></header>
    <nav aria-label="消息分类" className="mt-8 flex justify-between gap-3 overflow-x-auto border-b border-gray-100 pb-5 sm:justify-start sm:gap-12">
      {tabs.map(item => <button type="button" key={item.key} aria-current={tab === item.key ? 'page' : undefined} onClick={() => setParams({ tab: item.key })} className={cn('whitespace-nowrap text-sm text-gray-500 transition-colors hover:text-primary sm:text-base', tab === item.key && 'text-primary')}>{item.label}{badge(count(item.key))}</button>)}
    </nav>
    {tab !== 'chats' ? <NotificationList key={tab} category={tab === 'replies' ? 'reply' : tab === 'mentions' ? 'mention' : 'like'} /> : <div className="mt-4 grid overflow-hidden rounded-xl border border-gray-100 md:grid-cols-[300px_1fr]">
      <aside className={cn('min-w-0 border-r border-gray-100 bg-white', selectedContent && 'hidden md:block')}>
        <button type="button" onClick={() => setFriendsOpen(true)} className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-500"><span className="flex items-center gap-2"><Users className="h-4 w-4" />好友</span><ChevronRight className="h-4 w-4" /></button>
        {[{ id: 'system', label: '系统通知', count: summary.data?.system || 0 }, { id: 'social', label: '关注与好友', count: summary.data?.social || 0 }].map(item => <button type="button" key={item.id} onClick={() => setParams({ tab: 'chats', channel: item.id })} className={cn('flex w-full items-center gap-3 border-t border-gray-50 px-4 py-4 text-left hover:bg-primary/10', channel === item.id && 'bg-primary/10')}><span className="rounded-full bg-primary/10 p-2 text-primary"><Bell className="h-5 w-5" /></span><span className="flex-1 text-sm">{item.label}</span>{badge(item.count)}</button>)}
        {chats.isPending ? <p className="p-6 text-center text-sm text-gray-400">加载聊天列表…</p> : chats.isError ? <button type="button" onClick={() => void chats.refetch()} className="w-full p-6 text-sm text-red-500">加载失败，点击重试</button> : !chats.data?.records.length ? <p className="p-10 text-center text-sm text-gray-400">暂无聊天，选择好友开始吧</p> : chats.data.records.map(conversation => <button type="button" key={conversation.id} onClick={() => setParams({ tab: 'chats', conversation: conversation.id })} className={cn('flex w-full items-center gap-3 border-t border-gray-50 px-4 py-4 text-left hover:bg-gray-50', conversationId === conversation.id && 'bg-primary/10')}><Avatar src={conversation.avatarUrl} alt={conversation.nickname} size="md" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{conversation.nickname}</span><span className="shrink-0 text-[10px] text-gray-400">{formatDateTime(conversation.lastTime)}</span></div><p className="mt-1 truncate text-xs text-gray-400">{conversation.lastContent || '开始聊天'}</p></div>{badge(conversation.unreadCount)}</button>)}
        {chats.data && chats.data.total > 20 && <Pagination page={page} size={20} total={chats.data.total} onChange={value => { const next = new URLSearchParams(params); next.set('page', String(value)); setParams(next) }} />}
      </aside>
      <div className={cn('min-w-0', !selectedContent && 'hidden md:block')}>
        {channel ? <><button type="button" onClick={back} className="flex items-center gap-2 p-4 text-sm text-gray-500"><ArrowLeft className="h-4 w-4" />{channel === 'system' ? '系统通知' : '关注与好友'}</button><NotificationList key={channel} category={channel === 'system' ? 'system' : 'social'} /></> : conversationId ? selected.isPending ? <p className="p-16 text-center text-sm text-gray-400">加载会话…</p> : selected.isError ? <div className="p-10 text-center"><p className="mb-4 text-sm text-red-500">会话不存在或暂不可访问</p><button type="button" onClick={back}>返回聊天列表</button></div> : selected.data && <ChatPanel key={selected.data.id} conversation={selected.data} onBack={back} /> : <div className="flex h-[650px] flex-col items-center justify-center gap-4 text-gray-300"><Users className="h-12 w-12" /><p className="text-sm">选择会话或好友开始聊天</p></div>}
      </div>
    </div>}
    {settings && <MessageSettings onClose={() => setSettings(false)} />}
    {friendsOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-label="好友列表" className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6"><header className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">我的好友</h2><button type="button" aria-label="关闭好友列表" onClick={() => setFriendsOpen(false)}><X className="h-5 w-5" /></button></header><input aria-label="搜索好友" placeholder="搜索好友昵称" value={search} onChange={event => { setSearch(event.target.value); setFriendsPage(1) }} className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />{friends.isPending ? <p>加载中…</p> : friends.isError ? <button type="button" onClick={() => void friends.refetch()}>加载失败，点击重试</button> : !friends.data?.records.length ? <p className="py-10 text-center text-sm text-gray-400">暂无好友，互相关注后就能聊天</p> : friends.data.records.map(friend => <button type="button" key={friend.id} disabled={open.isPending} onClick={() => open.mutate(friend.id)} className="flex w-full items-center gap-3 rounded-lg py-3 text-left hover:bg-primary/10"><Avatar src={friend.avatarUrl} alt={friend.nickname} size="sm" /><span className="text-sm">{friend.nickname}</span></button>)}{friends.data && <Pagination page={friendsPage} size={20} total={friends.data.total} onChange={setFriendsPage} />}</section></div>}
  </div>
}
