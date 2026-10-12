import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Flag,
  Gamepad2,
  Heart,
  MessageCircle,
  MessageSquare,
  PenSquare,
  Search,
  ThumbsUp,
  Trash2,
  UserCheck,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { createComment, deleteComment, getComments, getCommentLocation } from '@/api/comment'
import { follow, unfollow } from '@/api/interaction'
import { getPost } from '@/api/post'
import { createReport } from '@/api/report'
import { getUserProfile } from '@/api/user'
import { CheckInCard } from '@/components/checkIn/CheckInCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'
import { MentionTextarea, MentionText } from '@/components/messages/MentionTextarea'
import type { Mention } from '@/types/messages'
import { useToast } from '@/components/ui/Toast'
import { useInteraction } from '@/hooks/useInteraction'
import { CONTENT_STATUS, TARGET_TYPE } from '@/lib/constants'
import { cn, formatDateTime, getContentStatusLabel, isApprovedPost, isValidId } from '@/lib/utils'
import { buildCommentThreads } from '@/lib/commentThreads'
import { canDeleteComment, getCommentDeletionMessage, getCommentPageAfterDeletion, isReplyTargetDeleted, refreshCommentDeletionQueries } from '@/lib/commentDeletion'
import { useAuthStore } from '@/store/authStore'
import type { CommentResp, CommentSort, Id, PageResult, PostResp } from '@/types/api'

const COMMENT_PAGE_SIZE = 20

const commentSortOptions: Array<{ value: CommentSort; label: string }> = [
  { value: 'DEFAULT', label: '默认' },
  { value: 'EARLIEST', label: '最早' },
  { value: 'LATEST', label: '最新' },
]

const toolLinks = [
  { to: '/community', label: '社区', icon: MessageSquare },
  { to: '/search', label: '搜索', icon: Search },
  { to: '/following', label: '关注流', icon: Users },
  { to: '/notifications', label: '通知', icon: Bell },
]

function CommentItem({
  comment,
  nested = false,
  replyToName,
  onReply,
  postAuthorId,
  onDelete,
  deletingId,
}: {
  comment: CommentResp
  nested?: boolean
  replyToName?: string
  onReply: (comment: CommentResp) => void
  postAuthorId: Id
  onDelete: (comment: CommentResp) => void
  deletingId: Id | null
}) {
  const { isAuthenticated, user, isAdmin } = useAuthStore()
  const authorName = comment.userNickname || '用户'

  return (
    <article id={`comment-${comment.id}`} className={cn('flex scroll-mt-24 gap-3 py-5 target:rounded-lg target:bg-primary/10', nested && 'py-4')}>
      <Link to={`/users/${comment.userId}`} className="shrink-0" aria-label={`查看 ${authorName} 的主页`}>
        <Avatar
          src={comment.userAvatarUrl}
          alt={`${authorName} 头像`}
          size={nested ? 'sm' : 'md'}
          className="rounded-md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to={`/users/${comment.userId}`} className="text-sm font-bold text-text hover:text-primary">
            {authorName}
          </Link>
          <time className="text-xs text-text-secondary">{formatDateTime(comment.gmtCreate)}</time>
        </div>
        {replyToName && <p className="mt-2 text-xs text-text-secondary">回复 @{replyToName}</p>}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary"><MentionText content={comment.content} mentions={comment.mentions} /></p>
        <footer className="mt-3 flex items-center gap-4 text-xs font-semibold text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" />
            {comment.likeCount}
          </span>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1 text-text-secondary transition-colors duration-200 hover:text-primary"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              回复
            </button>
          )}
          {isAuthenticated && canDeleteComment(user?.id, comment.userId, postAuthorId, isAdmin()) && (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              disabled={deletingId !== null}
              aria-label={`删除 ${authorName} 的评论`}
              className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deletingId === comment.id ? '删除中...' : '删除'}
            </button>
          )}
        </footer>
      </div>
    </article>
  )
}

function AuthorCard({ post }: { post: PostResp }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const { data: authorProfile, isError: authorProfileError } = useQuery({
    queryKey: ['user-profile', post.userId],
    queryFn: () => getUserProfile(post.userId),
    enabled: isValidId(post.userId),
    retry: false,
  })

  const isSelf = authorProfile?.isSelf ?? user?.id === post.userId
  const authorName = authorProfile?.nickname || post.authorNickname || post.authorUsername || '用户'
  const authorAvatar = authorProfile?.avatarUrl ?? post.authorAvatarUrl

  const followMutation = useMutation({
    mutationFn: () => {
      if (!authorProfile) {
        return Promise.reject(new Error('作者资料暂不可用'))
      }
      return authorProfile.isFollowing ? unfollow(authorProfile.id) : follow(authorProfile.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', post.userId] })
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const handleAction = () => {
    if (isSelf) {
      navigate('/profile')
      return
    }
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    followMutation.mutate()
  }

  const canShowAction = isSelf || !authorProfileError

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Link to={`/users/${post.userId}`} className="shrink-0" aria-label={`查看 ${authorName} 的主页`}>
          <Avatar src={authorAvatar} alt={`${authorName} 头像`} size="lg" className="rounded-full" />
        </Link>
        <Link to={`/users/${post.userId}`} className="min-w-0 flex-1 truncate text-sm font-bold text-text hover:text-primary">{authorName}</Link>
        {canShowAction && <Button size="sm" variant={isSelf || authorProfile?.isFollowing ? 'outline' : 'primary'} onClick={handleAction} loading={followMutation.isPending} className="shrink-0">
          {isSelf ? <PenSquare className="h-3 w-3" /> : authorProfile?.isFollowing ? <UserCheck className="h-3 w-3" /> : <UserRoundPlus className="h-3 w-3" />}
          {isSelf ? '编辑' : authorProfile?.isFollowing ? '已关注' : '关注'}
        </Button>}
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-text-secondary">{authorProfile?.bio || (authorProfileError ? '作者资料暂不可用。' : '这个用户还没有写简介。')}</p>
    </section>
  )
}

function ContentContextCard({ post }: { post: PostResp }) {
  return <section className="rounded-2xl bg-white p-4 shadow-sm">
    <div className="flex items-start gap-4 text-xs leading-6">
      <span className="shrink-0 font-bold text-text">分区</span>
      <Link to={`/community?boardId=${post.boardId}${post.gameId ? `&gameId=${post.gameId}` : ''}`} className="flex flex-wrap items-center gap-2 text-text-secondary hover:text-primary"><Gamepad2 className="h-4 w-4" />{post.gameName || '社区'}<span>–</span><MessageSquare className="h-4 w-4" />{post.boardName}</Link>
    </div>
    <div className="mt-3 flex items-start gap-4 text-xs">
      <span className="shrink-0 pt-1 font-bold text-text">话题</span>
      <div className="flex flex-wrap gap-2">
        {post.gameName && <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">#{post.gameName}</span>}
        {post.topics?.map(topic => <span key={topic.id} className="rounded-full bg-muted px-3 py-1 text-text-secondary">#{topic.name}</span>)}
        {!post.gameName && !post.topics?.length && <span className="pt-1 text-text-secondary">暂无话题</span>}
      </div>
    </div>
  </section>
}
function CommunityTools() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-text">社区工具</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {toolLinks.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md p-2 text-center text-xs font-semibold text-text-secondary transition-colors duration-200 hover:bg-muted hover:text-primary"
              >
                <Icon className="h-6 w-6 text-primary" />
                <span>{tool.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {isAuthenticated ? (
        <CheckInCard />
      ) : (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-black text-text">加入社区</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">登录后可参与讨论、关注创作者并领取每日签到奖励。</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/login" className="rounded-md bg-primary px-3 py-2 text-center text-sm font-black text-[#1f250c] hover:bg-primary-hover">
              登录
            </Link>
            <Link to="/register" className="rounded-md bg-muted px-3 py-2 text-center text-sm font-bold text-text hover:bg-border">
              注册
            </Link>
          </div>
        </section>
      )}
    </>
  )
}

export function PostDetailPage() {
  const { id: postId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, isAdmin } = useAuthStore()
  const [commentPage, setCommentPage] = useState(1)
  const [commentSort, setCommentSort] = useState<CommentSort>('DEFAULT')
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<Mention[]>([])
  const [replyTo, setReplyTo] = useState<CommentResp | null>(null)
  const [deletingId, setDeletingId] = useState<Id | null>(null)
  const located = useQuery({ queryKey: ['comment-location', searchParams.get('commentId')], queryFn: () => getCommentLocation(searchParams.get('commentId')!), enabled: !!searchParams.get('commentId') })
  useEffect(() => {
    if (located.error) toast('内容已删除或暂不可见', 'error')
  }, [located.error, toast])
  useEffect(() => {
    const location = located.data
    if (location && location.postId === postId) {
      const frame = requestAnimationFrame(() => { setCommentSort('DEFAULT'); setCommentPage(location.page) })
      return () => cancelAnimationFrame(frame)
    }
  }, [located.data, postId])

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: isValidId(postId),
  })

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId, commentPage, commentSort],
    queryFn: () => getComments({ postId: postId!, page: commentPage, size: COMMENT_PAGE_SIZE, sort: commentSort }),
    enabled: isValidId(postId),
  })
  useEffect(() => {
    const id = searchParams.get('commentId')
    if (id && located.data?.page === commentPage && comments?.records.some(comment => comment.id === id)) {
      requestAnimationFrame(() => { window.location.hash = `comment-${id}`; document.getElementById(`comment-${id}`)?.scrollIntoView({ block: 'center' }) })
    }
  }, [comments, located.data, commentPage, searchParams])

  const {
    liked,
    favorited,
    statusLoading,
    likeLoading,
    favoriteLoading,
    toggleLike,
    toggleFavorite,
  } = useInteraction(TARGET_TYPE.POST, postId!)

  const commentMutation = useMutation({
    mutationFn: () => createComment({
      postId: postId!,
      parentId: replyTo?.id,
      content,
      mentions,
    }),
    onSuccess: () => {
      toast('评论发表成功')
      setContent('')
      setMentions([])
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (comment: CommentResp) => deleteComment(comment.id),
    onSuccess: async (_result, comment) => {
      toast('评论已删除')
      const cachedComments = queryClient.getQueriesData<PageResult<CommentResp>>({ queryKey: ['comments', postId] })
        .flatMap(([, data]) => data?.records || [])
      setReplyTo(current => isReplyTargetDeleted(current, comment, cachedComments) ? null : current)
      await refreshCommentDeletionQueries(queryClient, postId!)
      setCommentPage(currentPage => {
        const refreshed = queryClient.getQueryData<PageResult<CommentResp>>(['comments', postId, currentPage, commentSort])
        return refreshed ? getCommentPageAfterDeletion(currentPage, refreshed.total, COMMENT_PAGE_SIZE) : currentPage
      })
    },
    onError: (err: Error) => toast(err.message, 'error'),
    onSettled: () => setDeletingId(null),
  })

  const removeComment = (comment: CommentResp) => {
    if (deletingId !== null || deleteMutation.isPending) return
    if (!window.confirm(getCommentDeletionMessage(comment))) return
    setDeletingId(comment.id)
    deleteMutation.mutate(comment)
  }

  const reportPost = async () => {
    if (!isAuthenticated || !post) {
      toast('请先登录', 'error')
      navigate('/login')
      return
    }
    const reason = window.prompt('请填写举报原因（最多500字）')?.trim()
    if (!reason) return
    try {
      await createReport({ targetType: TARGET_TYPE.POST, targetId: post.id, reason })
      toast('举报已提交，管理员会尽快处理')
    } catch (reportError) {
      toast(reportError instanceof Error ? reportError.message : '举报提交失败', 'error')
    }
  }

  const updateCommentSort = (nextSort: CommentSort) => {
    setCommentSort(nextSort)
    setCommentPage(1)
  }

  if (isLoading) return <Loading />
  if (error) {
    const message = error instanceof Error ? error.message : '加载失败'
    const isForbidden = message.includes('审核') || message.includes('权限')
    return (
      <div className="community-shell">
        <Empty title={isForbidden ? '内容暂不可见' : '帖子不存在'} description={isForbidden ? message : undefined} />
      </div>
    )
  }
  if (!post) return <Empty title="帖子不存在" />

  const isAuthor = user?.id === post.userId
  const canView = isApprovedPost(post.status) || isAuthor || isAdmin()

  if (!canView) {
    return (
      <div className="community-shell">
        <Empty title="内容暂不可见" description={`该帖子状态为：${getContentStatusLabel(post.status)}`} />
      </div>
    )
  }

  const showPendingBanner = post.status === CONTENT_STATUS.PENDING && (isAuthor || isAdmin())
  const commentThreads = buildCommentThreads(comments?.records || [])

  return (
    <div className="community-shell">
      {showPendingBanner && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          该帖子正在等待管理员审核，审核通过后会出现在社区列表中。
        </div>
      )}
      {post.status === CONTENT_STATUS.REJECTED && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          该帖子已被管理员封禁，不对外展示。修改内容不会解除封禁，需要管理员解封。
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <header className="border-b border-border pb-4">
              <h1 className="break-words text-2xl font-black leading-tight text-text">{post.title}</h1>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-secondary">
                <span className="rounded bg-muted px-2 py-1">图文</span>
                <time dateTime={post.gmtCreate}>{formatDateTime(post.gmtCreate)}</time>
              </div>
            </header>

            <div
              className="mt-4 break-words text-[15px] leading-8 text-text [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:bg-muted [&_blockquote]:px-4 [&_blockquote]:py-3 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:leading-tight [&_h1]:text-text [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-text [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-text [&_img]:my-3 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-md [&_img]:object-contain [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
              onClick={(event) => { const mention = (event.target as HTMLElement).closest('span[data-type="mention"]'); const id = mention?.getAttribute('data-id'); if (id && isValidId(id)) navigate(`/users/${id}`) }}
            />

            <footer className="mt-10 flex flex-wrap items-center justify-center gap-4 py-4">
              <Button
                variant={liked ? 'primary' : 'ghost'}
                className={cn('min-w-28 rounded-full px-6 py-3', !liked && 'bg-muted')}
                onClick={toggleLike}
                loading={statusLoading || likeLoading}
                title={liked ? '取消点赞' : '点赞'}
                aria-label={liked ? '取消点赞' : '点赞'}
              >
                <ThumbsUp className="h-4 w-4" />
                {post.likeCount}
              </Button>
              <Button
                variant={favorited ? 'primary' : 'ghost'}
                className={cn('min-w-28 rounded-full px-6 py-3', !favorited && 'bg-muted')}
                onClick={toggleFavorite}
                loading={statusLoading || favoriteLoading}
                title={favorited ? '取消收藏' : '收藏'}
                aria-label={favorited ? '取消收藏' : '收藏'}
              >
                <Heart className="h-4 w-4" />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button
                variant="ghost"
                onClick={reportPost}
                title="举报帖子"
                aria-label="举报帖子"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </footer>
          </article>

          <section id="post-comments" className="mt-4 scroll-mt-28 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-black text-text">评论 <span className="text-sm font-semibold text-text-secondary">{post.commentCount}</span></h2>
              <div className="inline-flex w-fit rounded-md bg-muted p-1" role="group" aria-label="评论排序">
                {commentSortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={commentSort === option.value}
                    onClick={() => updateCommentSort(option.value)}
                    className={cn(
                      'rounded px-3 py-1.5 text-xs font-bold transition-colors duration-200',
                      commentSort === option.value ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated && user ? (
              <div className="mt-6 flex gap-3">
                <Avatar src={user.avatarUrl} alt={`${user.nickname} 头像`} size="md" className="shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  {replyTo && (
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
                      <span className="truncate">回复 @{replyTo.userNickname}</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 font-semibold text-primary hover:text-primary-hover">
                        取消
                      </button>
                    </div>
                  )}
                  <MentionTextarea
                    placeholder={replyTo ? `回复 ${replyTo.userNickname}...` : '写下你的评论...'}
                    value={content}
                    onChange={setContent}
                    mentions={mentions}
                    onMentionsChange={setMentions}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => commentMutation.mutate()}
                      loading={commentMutation.isPending}
                      disabled={!content.trim()}
                    >
                      发布评论
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-md bg-muted px-4 py-3 text-sm text-text-secondary">
                登录后即可参与讨论。
                <Link to="/login" className="ml-2 font-bold text-primary hover:text-primary-hover">去登录</Link>
              </div>
            )}

            <div className="mt-6">
              {commentsLoading ? (
                <Loading text="加载评论..." />
              ) : commentThreads.length > 0 ? (
                <>
                  <div className="divide-y divide-border">
                    {commentThreads.map((thread) => (
                      <div key={thread.root.comment.id}>
                        <CommentItem {...thread.root} onReply={setReplyTo} postAuthorId={post.userId} onDelete={removeComment} deletingId={deletingId} />
                        {thread.replies.map((reply) => (
                          <div key={reply.comment.id} className="ml-6 border-l-2 border-primary/20 pl-4 sm:ml-12">
                            <CommentItem {...reply} nested onReply={setReplyTo} postAuthorId={post.userId} onDelete={removeComment} deletingId={deletingId} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {comments && (
                    <Pagination
                      page={commentPage}
                      size={COMMENT_PAGE_SIZE}
                      total={comments.total}
                      onChange={setCommentPage}
                    />
                  )}
                </>
              ) : (
                <Empty title="暂无评论" description="来发表第一条评论吧" />
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-3 lg:sticky lg:top-28">
          <AuthorCard post={post} />
          <ContentContextCard post={post} />
          <CommunityTools />
        </aside>
      </div>
      <div className="fixed bottom-24 right-5 z-30 hidden flex-col gap-3 min-[1500px]:flex" aria-label="帖子互动">
        <button type="button" disabled={statusLoading || likeLoading} onClick={toggleLike} aria-label={liked ? '取消点赞' : '点赞'} className={cn('flex h-14 w-14 flex-col items-center justify-center rounded-full border border-border bg-white text-xs shadow-sm', liked && 'text-primary')}><ThumbsUp className="mb-1 h-5 w-5" />{post.likeCount}</button>
        <button type="button" disabled={statusLoading || favoriteLoading} onClick={toggleFavorite} aria-label={favorited ? '取消收藏' : '收藏'} className={cn('flex h-14 w-14 flex-col items-center justify-center rounded-full border border-border bg-white text-xs shadow-sm', favorited && 'text-primary')}><Heart className="mb-1 h-5 w-5" />{post.favoriteCount}</button>
        <a href="#post-comments" aria-label="跳转评论" className="flex h-14 w-14 flex-col items-center justify-center rounded-full border border-border bg-white text-xs shadow-sm"><MessageCircle className="mb-1 h-5 w-5" />{post.commentCount}</a>
      </div>
    </div>
  )
}
