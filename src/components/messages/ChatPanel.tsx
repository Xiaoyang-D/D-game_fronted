import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Smile, Trash2 } from 'lucide-react'
import { deleteConversation, getMessageHistory, readConversation, recallMessage, sendMessage } from '@/api/message'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, cn } from '@/lib/utils'
import { randomUuid } from '@/lib/randomUuid'
import { useMessageConnection } from './MessageProvider'
import type { Conversation } from '@/types/messages'

/** 本人会话视图：展示身份、保留失败输入，只在前台实际展示消息后推进阅读位置。 */
export function ChatPanel({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const { user } = useAuthStore()
  const client = useQueryClient()
  const { toast } = useToast()
  const connected = useMessageConnection()
  const [body, setBody] = useState('')
  const [emojis, setEmojis] = useState(false)
  const [visible, setVisible] = useState(document.visibilityState === 'visible' && document.hasFocus())
  const [atBottom, setAtBottom] = useState(true)
  const [inView, setInView] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const viewport = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const lastRead = useRef('0')
  const attempt = useRef<{ body: string; id: string } | null>(null)
  const history = useInfiniteQuery({
    queryKey: ['chat-messages', conversation.id],
    queryFn: ({ pageParam }) => getMessageHistory(conversation.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.hasMore ? page.records[0]?.seq : undefined,
    refetchInterval: !connected && visible ? 5000 : false,
  })
  // 更早的分页放在前面，各页内部保持序号正序；雪花 ID 和序号始终保留为字符串。
  const records = history.data?.pages.slice().reverse().flatMap(page => page.records) || []
  const last = records.at(-1)
  const refresh = async () => {
    await Promise.all(['chat-messages', 'conversations', 'message-summary'].map(key => client.invalidateQueries({ queryKey: [key] })))
  }
  const sending = useMutation({
    mutationFn: ({ text, id }: { text: string; id: string }) => sendMessage(conversation.id, text, id),
    onSuccess: async (_message, variables) => {
      setBody(current => current === variables.text ? '' : current); attempt.current = null; nearBottom.current = true
      await refresh()
    },
    onError: (error: Error) => toast(`${error.message}，可重试发送`, 'error'),
  })
  const recalling = useMutation({ mutationFn: recallMessage, onSuccess: refresh, onError: (error: Error) => toast(error.message, 'error') })
  const deleting = useMutation({ mutationFn: () => deleteConversation(conversation.id), onSuccess: async () => { onBack(); client.removeQueries({ queryKey: ['chat-messages', conversation.id] }); await refresh() }, onError: (error: Error) => toast(error.message, 'error') })
  const submit = () => {
    // 正文不变的失败重试沿用同一 UUID，避免响应丢失后重复生成消息。
    if (!body.trim() || body.length > 2000 || sending.isPending || !conversation.isFriend) return
    if (attempt.current?.body !== body) attempt.current = { body, id: randomUuid() }
    sending.mutate({ text: body, id: attempt.current.id })
  }
  useEffect(() => {
    const visibility = () => setVisible(document.visibilityState === 'visible' && document.hasFocus())
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', visibility)
    window.addEventListener('blur', visibility)
    const timer = setInterval(() => setNow(Date.now()), 1000)
    // 同时观察聊天内部滚动和页面可见区域，防止后台标签页或屏幕外消息被自动已读。
    const observer = new IntersectionObserver(([entry]) => setAtBottom(entry.isIntersecting), { root: viewport.current, threshold: 1 })
    const screenObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 1 })
    if (bottom.current) observer.observe(bottom.current)
    if (bottom.current) screenObserver.observe(bottom.current)
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('focus', visibility); window.removeEventListener('blur', visibility); clearInterval(timer); observer.disconnect(); screenObserver.disconnect() }
  }, [])
  useLayoutEffect(() => { if (nearBottom.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight }, [last?.id, history.dataUpdatedAt])
  useEffect(() => {
    if (!visible || !atBottom || !inView || !last || BigInt(last.seq) <= BigInt(lastRead.current)) return
    const seq = last.seq
    lastRead.current = seq
    void readConversation(conversation.id, seq).then(() => Promise.all(['message-summary', 'conversations'].map(key => client.invalidateQueries({ queryKey: [key] })))).catch(() => { lastRead.current = '0' })
  }, [visible, atBottom, inView, last, conversation.id, client, now])
  return <section className="flex h-[calc(100dvh-290px)] min-h-[360px] flex-col bg-white md:h-[650px]">
    <header className="flex items-center gap-3 border-b border-gray-100 p-4">
      <button type="button" aria-label="返回聊天列表" onClick={onBack} className="p-1 md:hidden"><ArrowLeft className="h-5 w-5" /></button>
      <Avatar src={conversation.avatarUrl} alt={conversation.nickname} size="sm" />
      <Link to={`/users/${conversation.friendId}`} className="min-w-0 flex-1 truncate font-medium">{conversation.nickname}</Link>
      <button type="button" aria-label="删除会话" disabled={deleting.isPending} onClick={() => { if (window.confirm('确定删除此会话吗？将隐藏你的已有聊天记录，对方的记录不受影响。')) deleting.mutate() }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
    </header>
    <div ref={viewport} onScroll={() => { const element = viewport.current; if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 70 }} className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] p-4">
      {history.hasNextPage && <button type="button" disabled={history.isFetchingNextPage} onClick={() => { nearBottom.current = false; void history.fetchNextPage() }} className="mb-4 w-full text-xs text-primary">{history.isFetchingNextPage ? '加载中…' : '查看更早消息'}</button>}
      {history.isPending && <p className="text-center text-sm text-gray-400">加载聊天记录…</p>}
      {history.isError && <button type="button" onClick={() => void history.refetch()} className="w-full text-sm text-red-500">聊天记录加载失败，点击重试</button>}
      {!history.isPending && !records.length && <p className="py-16 text-center text-sm text-gray-400">开始和好友聊天吧</p>}
      {records.map(message => {
        const isOwn = message.senderId === user?.id
        // cn 只拼接类名，因此对齐和背景色必须二选一，不能依赖冲突样式的排列顺序。
        const senderName = isOwn ? user?.nickname || user?.username || '我' : conversation.nickname
        return <article key={message.id} aria-label={`${senderName}${isOwn ? '（我）' : ''}的消息`} className="mb-4">
          <p className="mb-2 text-center text-[11px] text-gray-400">{formatDateTime(message.gmtCreate)}</p>
          {message.recalled ? <p className="text-center text-xs text-gray-400">{isOwn ? '你撤回了一条消息' : '对方撤回了一条消息'}</p> : <div className={cn('flex items-start gap-2', isOwn && 'flex-row-reverse')}>
            <Avatar src={isOwn ? user?.avatarUrl : conversation.avatarUrl} alt={`${senderName}头像`} size="sm" className="shrink-0" />
            <div className={cn('flex min-w-0 max-w-[85%] flex-col', isOwn ? 'items-end' : 'items-start')}>
              <Link to={`/users/${message.senderId}`} className="mb-1 max-w-full truncate text-xs text-gray-500">{senderName}{isOwn && '（我）'}</Link>
              <p className={cn('max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm', isOwn ? 'bg-primary/15' : 'bg-white')}>{message.content}</p>
              {isOwn && now < new Date(message.recallDeadline).getTime() && <button type="button" disabled={recalling.isPending} onClick={() => recalling.mutate(message.id)} className="mt-1 text-[11px] text-gray-400 hover:text-primary">撤回</button>}
            </div>
          </div>}
        </article>
      })}
      <div ref={bottom} className="h-1" />
    </div>
    <div className="border-t border-gray-100 p-4">
      {!conversation.isFriend ? <p className="py-5 text-center text-sm text-gray-500">好友关系已解除，仍可查看历史，无法发送新消息。</p> : <>
        <div className="mb-2 flex items-center justify-between text-xs text-gray-400"><button type="button" aria-label="选择表情" onClick={() => setEmojis(value => !value)}><Smile className="h-5 w-5" /></button><span>{body.length}/2000</span></div>
        {emojis && <div className="mb-2 flex flex-wrap gap-2">{['😀', '😂', '🥰', '🤔', '😭', '👍', '❤️', '🎮', '🎉', '🙌', '😎', '🔥'].map(emoji => <button type="button" key={emoji} disabled={sending.isPending || body.length + emoji.length > 2000} onClick={() => setBody(value => value + emoji)} className="rounded p-1 text-xl hover:bg-primary/10">{emoji}</button>)}</div>}
        <textarea aria-label="私信内容" value={body} disabled={sending.isPending} maxLength={2000} onChange={event => setBody(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit() } }} placeholder="发送消息，Enter 发送，Shift+Enter 换行" className="h-20 w-full resize-none text-sm outline-none" />
        <div className="mr-12 flex justify-end md:mr-0"><Button size="sm" loading={sending.isPending} disabled={!body.trim()} onClick={submit}><Send className="h-4 w-4" />发送</Button></div>
      </>}
    </div>
  </section>
}
