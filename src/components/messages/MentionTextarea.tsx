import { useDeferredValue, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { searchMentionUsers } from '@/api/message'
import { mentionQuery, moveMentions } from '@/lib/mentions'
import type { Mention, UserBrief } from '@/types/messages'

/** 评论保持纯文本，提及通过用户 ID 和 UTF-16 位置单独提交，不按昵称猜测用户。 */
export function MentionTextarea({ value, mentions, onChange, onMentionsChange, placeholder }: {
  value: string; mentions: Mention[]; onChange: (value: string) => void; onMentionsChange: (mentions: Mention[]) => void; placeholder: string
}) {
  const input = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState(0)
  const [composing, setComposing] = useState(false)
  const [active, setActive] = useState(0)
  const current = composing ? null : mentionQuery(value, caret)
  const q = useDeferredValue(current?.q || '')
  const candidates = useQuery({ queryKey: ['mention-candidates', q], queryFn: () => searchMentionUsers(q), enabled: !!q, staleTime: 10000 })
  const choose = (user: UserBrief) => {
    if (!current) return
    if (!mentions.some(item => item.userId === user.id) && new Set(mentions.map(item => item.userId)).size >= 10) return
    const label = `@${user.nickname}`
    const next = value.slice(0, current.start) + label + ' ' + value.slice(caret)
    if (next.length > 2000) return
    onMentionsChange([...moveMentions(value, next, mentions), { userId: user.id, start: current.start, end: current.start + label.length }].sort((a, b) => a.start - b.start))
    onChange(next)
    const position = current.start + label.length + 1
    setCaret(position)
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(position, position) })
  }
  return <div className="relative"><textarea ref={input} aria-label="发表评论" value={value} maxLength={2000} placeholder={placeholder} onCompositionStart={() => setComposing(true)} onCompositionEnd={event => { setComposing(false); setCaret(event.currentTarget.selectionStart) }} onChange={event => { onMentionsChange(moveMentions(value, event.target.value, mentions)); onChange(event.target.value); setCaret(event.target.selectionStart); setActive(0) }} onSelect={event => setCaret(event.currentTarget.selectionStart)} onKeyDown={event => {
    const users = current && q === current.q ? candidates.data || [] : []
    if (event.nativeEvent.isComposing || !users.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => (index + 1) % users.length) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => (index + users.length - 1) % users.length) }
    if (event.key === 'Enter') { event.preventDefault(); choose(users[active % users.length]) }
  }} className="min-h-28 w-full rounded-lg border border-primary/50 p-3 text-sm outline-none focus:border-primary" />
    {current && q === current.q && !!candidates.data?.length && <div role="listbox" aria-label="选择提及用户" className="absolute left-0 top-full z-20 max-h-48 min-w-52 overflow-auto rounded-lg border bg-white py-1 shadow-lg">{candidates.data.map((user, index) => <button role="option" aria-selected={index === active} type="button" key={user.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(user)} className={`block w-full px-4 py-2 text-left text-sm ${index === active ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>{user.nickname}</button>)}</div>}
  </div>
}

export function MentionText({ content, mentions = [] }: { content: string; mentions?: Mention[] }) {
  const parts: React.ReactNode[] = []
  let position = 0
  for (const mention of mentions) {
    if (mention.start < position || mention.end > content.length) continue
    parts.push(content.slice(position, mention.start), <Link key={`${mention.userId}-${mention.start}`} to={`/users/${mention.userId}`} className="text-primary hover:underline">{content.slice(mention.start, mention.end)}</Link>)
    position = mention.end
  }
  parts.push(content.slice(position))
  return <>{parts}</>
}
