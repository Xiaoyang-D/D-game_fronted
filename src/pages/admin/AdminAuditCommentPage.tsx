import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditComment } from '@/api/admin'
import { getComments } from '@/api/comment'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime, isValidId } from '@/lib/utils'
import type { Id } from '@/types/api'

export function AdminAuditCommentPage() {
  const { toast } = useToast()
  const [commentId, setCommentId] = useState('')
  const [postId, setPostId] = useState('')
  const [searchPostId, setSearchPostId] = useState<Id | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: comments, isLoading } = useQuery({
    queryKey: ['admin', 'comments', searchPostId],
    queryFn: () => getComments({ postId: searchPostId!, page: 1, size: 100 }),
    enabled: searchPostId !== null,
  })

  const targetComment = comments?.records.find((c) => c.id === commentId.trim())

  const handleSearch = () => {
    const id = postId.trim()
    if (!isValidId(id)) {
      toast('请输入有效的帖子 ID', 'error')
      return
    }
    setSearchPostId(id)
  }

  const handleAudit = async (approved: boolean) => {
    const id = commentId.trim()
    if (!isValidId(id)) {
      toast('请输入有效的评论 ID', 'error')
      return
    }
    setLoading(true)
    try {
      await auditComment(id, { approved, reason: reason || undefined })
      toast(approved ? '评论已通过审核' : '评论已拒绝')
    } catch (err) {
      toast(err instanceof Error ? err.message : '审核失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">评论审核</h1>
      <p className="mt-1 text-sm text-text-secondary">输入帖子 ID 查找评论，再输入评论 ID 进行审核</p>

      <Card className="mt-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="帖子 ID（用于查找评论）"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>查询评论</Button>
          </div>
          <Input
            label="评论 ID"
            placeholder="输入要审核的评论 ID"
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
          />
        </div>
      </Card>

      {isLoading && <Loading />}
      {searchPostId !== null && !isLoading && comments && comments.records.length === 0 && (
        <Empty title="该帖子暂无评论" />
      )}
      {targetComment && (
        <Card className="mt-6">
          <p className="text-sm font-medium text-text">{targetComment.userNickname}</p>
          <p className="mt-2 text-sm text-text-secondary">{targetComment.content}</p>
          <p className="mt-2 text-xs text-text-secondary">{formatDateTime(targetComment.gmtCreate)}</p>
          <Textarea
            label="审核备注（可选）"
            className="mt-4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-4 flex gap-3">
            <Button onClick={() => handleAudit(true)} loading={loading}>通过</Button>
            <Button variant="danger" onClick={() => handleAudit(false)} loading={loading}>拒绝</Button>
          </div>
        </Card>
      )}
      {searchPostId !== null && !isLoading && comments && comments.records.length > 0 && !targetComment && commentId && (
        <Empty title="未找到该评论 ID" description="请确认评论 ID 是否正确" />
      )}
    </div>
  )
}
