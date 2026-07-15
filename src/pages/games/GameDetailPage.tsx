import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Gamepad2, Heart, MessageSquare, PenSquare, Star, ThumbsUp } from 'lucide-react'
import { getGame, getGameReviews, rateGame } from '@/api/game'
import { getPosts } from '@/api/post'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { RatingStars } from '@/components/ui/RatingStars'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useInteraction } from '@/hooks/useInteraction'
import { TARGET_TYPE } from '@/lib/constants'
import { formatDate, formatDateTime, formatRating, isValidId } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function GameDetailPage() {
  const { id: gameId } = useParams<{ id: string }>()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [score, setScore] = useState(0)
  const [summary, setSummary] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [playtimeHours, setPlaytimeHours] = useState('')

  const { data: game, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => getGame(gameId!),
    enabled: isValidId(gameId),
  })

  const {
    liked,
    favorited,
    statusLoading,
    likeLoading,
    favoriteLoading,
    toggleLike,
    toggleFavorite,
  } = useInteraction(
    TARGET_TYPE.GAME,
    gameId!,
  )

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['game-reviews', gameId],
    queryFn: () => getGameReviews(gameId!, { page: 1, size: 8 }),
    enabled: isValidId(gameId),
  })

  const { data: linkedPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['game-posts', gameId],
    queryFn: () => getPosts({ gameId: gameId!, page: 1, size: 5 }),
    enabled: isValidId(gameId),
  })

  const rateMutation = useMutation({
    mutationFn: () => {
      const hours = playtimeHours.trim() ? Number(playtimeHours) : undefined
      return rateGame(gameId!, {
        score,
        summary: summary.trim() || undefined,
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        playtimeHours: Number.isNaN(hours) ? undefined : hours,
      })
    },
    onSuccess: () => {
      toast('评测已提交')
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game-reviews', gameId] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  if (isLoading) return <Loading />
  if (error || !game) return <Empty title="游戏不存在" />

  const handleRate = () => {
    if (!isAuthenticated) {
      toast('请先登录', 'error')
      return
    }
    if (score < 1) {
      toast('请选择评分', 'error')
      return
    }
    if (playtimeHours.trim()) {
      const hours = Number(playtimeHours)
      if (!Number.isInteger(hours) || hours < 0) {
        toast('游玩时长需填写非负整数', 'error')
        return
      }
    }
    rateMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden p-0">
            <div className="aspect-square bg-muted">
              {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Gamepad2 className="h-20 w-20 text-border" />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-text">{game.name}</h1>
          <p className="mt-2 text-text-secondary">{game.categoryName}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold">{formatRating(game.avgRating)}</span>
              <span className="text-sm text-text-secondary">({game.ratingCount} 人评分)</span>
            </div>
            {game.developer && (
              <span className="text-sm text-text-secondary">开发商：{game.developer}</span>
            )}
            {game.releaseDate && (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <Calendar className="h-4 w-4" />
                {formatDate(game.releaseDate)}
              </span>
            )}
          </div>

          {game.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {game.description && (
            <Card className="mt-6">
              <h2 className="font-semibold text-text">游戏简介</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                {game.description}
              </p>
            </Card>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant={liked ? 'primary' : 'outline'}
              onClick={toggleLike}
              loading={statusLoading || likeLoading}
            >
              <ThumbsUp className="h-4 w-4" />
              {liked ? '已点赞' : '点赞'}
            </Button>
            <Button
              variant={favorited ? 'primary' : 'outline'}
              onClick={toggleFavorite}
              loading={statusLoading || favoriteLoading}
            >
              <Heart className="h-4 w-4" />
              {favorited ? '已收藏' : '收藏'}
            </Button>
          </div>

          <Card className="mt-6">
            <h2 className="font-semibold text-text">写游戏评测</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <RatingStars value={score} onChange={setScore} />
              <span className="text-sm text-text-secondary">{score > 0 ? `${score}/10` : '请选择评分'}</span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="游玩时长（小时）"
                type="number"
                min={0}
                step={1}
                value={playtimeHours}
                onChange={(e) => setPlaytimeHours(e.target.value)}
              />
              <Textarea
                label="一句短评"
                rows={3}
                maxLength={300}
                placeholder="这款游戏最打动你的地方是什么？"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <Textarea
                label="优点"
                rows={4}
                maxLength={500}
                placeholder="玩法、剧情、美术、联机体验..."
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
              <Textarea
                label="缺点"
                rows={4}
                maxLength={500}
                placeholder="节奏、优化、平衡、内容量..."
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={handleRate} loading={rateMutation.isPending}>
                提交评测
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">玩家评测</h2>
            <span className="text-sm text-text-secondary">{game.ratingCount} 条评分</span>
          </div>
          <div className="mt-4">
            {reviewsLoading ? (
              <Loading text="加载评测..." />
            ) : reviews && reviews.records.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.records.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-text">{review.userNickname}</p>
                        <p className="text-xs text-text-secondary">{formatDateTime(review.gmtCreate)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-amber-600">
                        <RatingStars value={review.score} size="sm" />
                        <span className="text-sm font-semibold">{review.score}/10</span>
                      </div>
                    </div>
                    {review.playtimeHours !== null && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                        <Clock className="h-3 w-3" />
                        游玩 {review.playtimeHours} 小时
                      </p>
                    )}
                    {review.summary && <p className="mt-3 text-sm text-text">{review.summary}</p>}
                    {(review.pros || review.cons) && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {review.pros && (
                          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                            <span className="font-medium">优点：</span>{review.pros}
                          </div>
                        )}
                        {review.cons && (
                          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                            <span className="font-medium">缺点：</span>{review.cons}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="暂无评测" description="来写下第一条玩家评测吧" />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">关联讨论</h2>
            {isAuthenticated && (
              <Link to={`/posts/new?gameId=${game.id}`}>
                <Button size="sm" variant="outline">
                  <PenSquare className="h-4 w-4" />
                  发起讨论
                </Button>
              </Link>
            )}
          </div>
          <div className="mt-4">
            {postsLoading ? (
              <Loading text="加载讨论..." />
            ) : linkedPosts && linkedPosts.records.length > 0 ? (
              <div className="flex flex-col gap-3">
                {linkedPosts.records.map((post) => (
                  <Link key={post.id} to={`/posts/${post.id}`} className="block rounded-md border border-border p-3 hover:bg-muted">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 font-medium text-text">{post.title}</h3>
                        <p className="mt-1 text-xs text-text-secondary">
                          {post.authorNickname} · {post.boardName} · {formatDateTime(post.gmtCreate)}
                        </p>
                        <p className="mt-2 text-xs text-text-secondary">
                          {post.viewCount} 浏览 · {post.likeCount} 点赞 · {post.commentCount} 评论
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty title="暂无讨论" description="围绕这款游戏发起第一篇帖子" />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
