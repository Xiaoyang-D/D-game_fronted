import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteComment, getMyModeratedComments, updateModeratedComment } from '@/api/comment'
import { getLatestModeration } from '@/api/moderation'
import { MentionTextarea } from '@/components/messages/MentionTextarea'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'
import type { CommentResp, Id } from '@/types/api'
import type { Mention } from '@/types/messages'
import { ModerationNotice } from './ModerationNotice'

export function MyModeratedComments({ postId }: { postId: Id }) {
  const userId = useAuthStore(state => state.user?.id)
  const client = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<CommentResp | null>(null)
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<Mention[]>([])
  const query = useQuery({ queryKey: ['my-moderated-comments', userId, postId, page], queryFn: () => getMyModeratedComments({ postId, page, size: 10 }), enabled: Boolean(userId), staleTime: 0 })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['my-moderated-comments', userId, postId] }),
      client.invalidateQueries({ queryKey: ['comments', postId] }),
      client.invalidateQueries({ queryKey: ['post', postId] }),
    ])
    const refreshed = client.getQueryData<typeof query.data>(['my-moderated-comments', userId, postId, page])
    if (refreshed && page > 1 && !refreshed.records.length) setPage(current => current - 1)
  }
  const save = useMutation({
    mutationFn: () => updateModeratedComment(editing!.id, { content, mentions }),
    onSuccess: async id => {
      setEditing(null)
      try {
        const review = await getLatestModeration('COMMENT', id)
        toast(review?.status === 'PENDING' ? '评论已重新提交审核' : '评论已公开')
      } catch { toast('评论已提交，请查看审核状态') }
      await refresh()
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: async () => { setEditing(null); toast('评论已删除'); await refresh() },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  if (!userId) return null
  if (query.isPending) return <p className="mt-5 text-xs text-text-secondary">加载我的审核中评论…</p>
  if (query.isError) return <button className="mt-5 text-sm text-red-600" onClick={() => void query.refetch()}>我的审核中评论加载失败，点击重试</button>
  if (!query.data.records.length && !query.data.total) return null
  return <section id="my-moderated-comments" className="mt-6 rounded-lg border border-amber-200 bg-amber-50/30 p-4" aria-label="我的审核中评论">
    <h3 className="font-bold text-text">我的待审核 / 未通过评论</h3>
    <p className="mt-1 text-xs text-text-secondary">仅自己可见，通过后会加入公开评论列表。普通已发布评论不支持编辑。</p>
    <div className="divide-y divide-amber-100">{query.data.records.map(comment => <article key={comment.id} id={`my-comment-${comment.id}`} className="py-4">
      <p className="mb-2 text-xs text-text-secondary">{comment.parentId === '0' ? '评论' : '回复'} · {formatDateTime(comment.gmtCreate)}</p>
      <ModerationNotice moderation={comment.moderation} />
      {editing?.id === comment.id ? <div className="mt-3">
        <MentionTextarea value={content} onChange={setContent} mentions={mentions} onMentionsChange={setMentions} placeholder="修改评论后重新提交" />
        <div className="mt-3 flex gap-2"><Button size="sm" loading={save.isPending} disabled={!content.trim() || remove.isPending} onClick={() => save.mutate()}>重新提交</Button><Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => setEditing(null)}>取消</Button></div>
      </div> : <><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{comment.content}</p><div className="mt-3 flex gap-3">
        <Button size="sm" variant="outline" disabled={save.isPending || remove.isPending} onClick={() => { setEditing(comment); setContent(comment.content); setMentions(comment.mentions || []) }}>修改并重提</Button>
        <Button size="sm" variant="ghost" disabled={save.isPending || remove.isPending} onClick={() => { if (window.confirm('确定删除这条尚未公开的评论吗？')) remove.mutate(comment.id) }}>删除</Button>
      </div></>}
    </article>)}</div>
    <Pagination page={page} size={10} total={query.data.total} onChange={setPage} />
  </section>
}
