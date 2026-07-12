import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Flag, Gamepad2, Heart, MessageCircle, ThumbsUp } from 'lucide-react'
import { getComments, createComment } from '@/api/comment'
import { getPost } from '@/api/post'
import { createReport } from '@/api/report'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { useInteraction } from '@/hooks/useInteraction'
import { useAuthStore } from '@/store/authStore'
import { TARGET_TYPE } from '@/lib/constants'
import { formatDateTime, getContentStatusLabel, isApprovedPost, isTopLevelComment, isValidId } from '@/lib/utils'
import type { CommentResp, Id } from '@/types/api'
import { CONTENT_STATUS } from '@/lib/constants'

function CommentItem({
  comment,
  onReply,
}: {
  comment: CommentResp
  onReply: (parentId: Id) => void
}) {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{comment.userNickname}</span>
        <span className="text-xs text-text-secondary">{formatDateTime(comment.gmtCreate)}</span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">{comment.content}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> {comment.likeCount}
        </span>
        {isAuthenticated && (
          <button
            onClick={() => onReply(comment.id)}
            className="text-primary hover:text-primary-hover cursor-pointer transition-colors duration-200"
          >
            回复
          </button>
        )}
      </div>
    </div>
  )
}

export function PostDetailPage() {
  const { id: postId } = useParams<{ id: string }>()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, isAdmin } = useAuthStore()
  const [commentPage, setCommentPage] = useState(1)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<Id | null>(null)
  const commentSize = 20

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: isValidId(postId),
  })

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId, commentPage],
    queryFn: () => getComments({ postId: postId!, page: commentPage, size: commentSize }),
    enabled: isValidId(postId),
  })

  const { liked, favorited, loading: interactionLoading, toggleLike, toggleFavorite } = useInteraction(
    TARGET_TYPE.POST,
    postId!,
  )

  const commentMutation = useMutation({
    mutationFn: () =>
      createComment({
        postId: postId!,
        parentId: replyTo || undefined,
        content,
      }),
    onSuccess: () => {
      toast('评论发表成功')
      setContent('')
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const reportPost = async () => {
    if (!isAuthenticated || !post) {
      toast('请先登录', 'error')
      return
    }
    const reason = window.prompt('请填写举报原因（最多 500 字）')?.trim()
    if (!reason) return
    try {
      await createReport({ targetType: TARGET_TYPE.POST, targetId: post.id, reason })
      toast('举报已提交，管理员会尽快处理')
    } catch (error) {
      toast(error instanceof Error ? error.message : '举报提交失败', 'error')
    }
  }

  if (isLoading) return <Loading />
  if (error) {
    const message = error instanceof Error ? error.message : '加载失败'
    const isForbidden = message.includes('审核') || message.includes('权限')
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Empty
          title={isForbidden ? '内容暂不可见' : '帖子不存在'}
          description={isForbidden ? message : undefined}
        />
      </div>
    )
  }
  if (!post) return <Empty title="帖子不存在" />

  const isAuthor = user?.id === post.userId
  const canView = isApprovedPost(post.status) || isAuthor || isAdmin()

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Empty
          title="内容暂不可见"
          description={`该帖子状态为：${getContentStatusLabel(post.status)}`}
        />
      </div>
    )
  }

  const showPendingBanner = post.status === CONTENT_STATUS.PENDING && (isAuthor || isAdmin())

  const topComments = comments?.records.filter((c) => isTopLevelComment(c.parentId)) || []
  const repliesMap = comments?.records
    .filter((c) => !isTopLevelComment(c.parentId))
    .reduce<Record<Id, CommentResp[]>>((acc, c) => {
      if (!acc[c.parentId]) acc[c.parentId] = []
      acc[c.parentId].push(c)
      return acc
    }, {}) || {}

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {showPendingBanner && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          该帖子正在等待管理员审核，审核通过后将出现在社区列表中。
        </div>
      )}
      <Card>
        <h1 className="text-2xl font-bold text-text">{post.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {post.authorNickname} · {post.boardName} · {formatDateTime(post.gmtCreate)}
        </p>
        {post.gameId && post.gameName && (
          <Link
            to={`/games/${post.gameId}`}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:text-primary-hover"
          >
            <Gamepad2 className="h-4 w-4" />
            {post.gameName}
          </Link>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.viewCount}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {post.likeCount}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {post.commentCount}</span>
          <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.favoriteCount}</span>
        </div>
        <div
          className="mt-6 prose prose-sm max-w-none text-text-secondary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="mt-6 flex gap-3">
          <Button variant={liked ? 'primary' : 'outline'} onClick={toggleLike} loading={interactionLoading}>
            <ThumbsUp className="h-4 w-4" />
            {liked ? '已点赞' : '点赞'}
          </Button>
          <Button variant={favorited ? 'primary' : 'outline'} onClick={toggleFavorite} loading={interactionLoading}>
            <Heart className="h-4 w-4" />
            {favorited ? '已收藏' : '收藏'}
          </Button>
          <Button variant="outline" onClick={reportPost}>
            <Flag className="h-4 w-4" />举报
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-text">评论 ({post.commentCount})</h2>

        {isAuthenticated ? (
          <div className="mt-4">
            {replyTo && (
              <p className="mb-2 text-xs text-text-secondary">
                回复评论 #{replyTo}
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-primary cursor-pointer"
                >
                  取消
                </button>
              </p>
            )}
            <Textarea
              placeholder="写下你的评论..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              className="mt-2"
              size="sm"
              onClick={() => commentMutation.mutate()}
              loading={commentMutation.isPending}
              disabled={!content.trim()}
            >
              发表评论
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-secondary">登录后即可发表评论</p>
        )}

        <div className="mt-6">
          {commentsLoading ? (
            <Loading text="加载评论..." />
          ) : topComments.length > 0 ? (
            <>
              {topComments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem comment={comment} onReply={setReplyTo} />
                  {repliesMap[comment.id]?.map((reply) => (
                    <div key={reply.id} className="ml-8 border-l-2 border-primary/20 pl-4">
                      <CommentItem comment={reply} onReply={setReplyTo} />
                    </div>
                  ))}
                </div>
              ))}
              {comments && (
                <Pagination
                  page={commentPage}
                  size={commentSize}
                  total={comments.total}
                  onChange={setCommentPage}
                />
              )}
            </>
          ) : (
            <Empty title="暂无评论" description="来发表第一条评论吧" />
          )}
        </div>
      </Card>
    </div>
  )
}
