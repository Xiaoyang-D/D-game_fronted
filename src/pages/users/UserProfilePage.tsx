import { type ComponentType, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Heart, PenSquare, ThumbsUp, UserRoundPlus, Users, Gamepad2 } from 'lucide-react'
import heroImage from '@/assets/hero.png'
import { getPosts } from '@/api/post'
import { follow, unfollow } from '@/api/interaction'
import { getUserFavorites, getUserProfile } from '@/api/user'
import { PostCard } from '@/components/community/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { TARGET_TYPE } from '@/lib/constants'
import { cn, formatDateTime, isValidId } from '@/lib/utils'
import type { PostResp, UserFavoriteResp } from '@/types/api'

const PAGE_SIZE = 10

type TabKey = 'posts' | 'favorites'

function parsePage(value: string | null): number {
  const parsed = Number(value || '1')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function getActiveTab(value: string | null): TabKey {
  return value === 'favorites' ? 'favorites' : 'posts'
}

function toPostResp(item: UserFavoriteResp): PostResp {
  return {
    id: item.targetId,
    boardId: item.boardId || item.targetId,
    boardName: item.boardName || '未知板块',
    gameId: item.gameId,
    gameName: item.gameName,
    userId: item.userId || item.targetId,
    authorNickname: item.authorNickname || '用户',
    authorUsername: item.authorUsername || undefined,
    authorAvatarUrl: item.authorAvatarUrl || undefined,
    authorStatus: item.authorStatus || undefined,
    title: item.title,
    content: item.content || '',
    status: item.status || 2,
    viewCount: item.viewCount || 0,
    likeCount: item.likeCount || 0,
    commentCount: item.commentCount || 0,
    favoriteCount: item.favoriteCount || 0,
    gmtCreate: item.gmtCreate,
  }
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/65">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-xl font-black text-white">{value}</div>
    </div>
  )
}

function FavoriteGameCard({ item }: { item: UserFavoriteResp }) {
  return (
    <Link
      to={`/games/${item.targetId}`}
      className="block rounded-lg border border-border bg-white p-4 shadow-sm transition-colors duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-emerald-700">
        游戏收藏
      </div>
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 className="h-8 w-8 text-border" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-lg font-black text-text">{item.title}</h3>
          <p className="mt-1 text-xs text-text-secondary">
            {item.categoryName || '未知分类'}
            {item.avgRating !== null ? ` · ${item.avgRating.toFixed(1)} 分` : ''}
            {item.ratingCount !== null ? ` · ${item.ratingCount} 人评分` : ''}
          </p>
          {item.content && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-secondary">
              {item.content}
            </p>
          )}
          <p className="mt-3 text-xs text-text-secondary">
            收藏于 {formatDateTime(item.gmtCreate)}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function UserProfilePage() {
  const { id: userId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const tab = getActiveTab(searchParams.get('tab'))
  const postsPage = parsePage(searchParams.get('postsPage'))
  const favoritesPage = parsePage(searchParams.get('favoritesPage'))

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: isValidId(userId),
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-profile-posts', userId, postsPage],
    queryFn: () => getPosts({ authorId: userId!, page: postsPage, size: PAGE_SIZE }),
    enabled: isValidId(userId) && !!profile && tab === 'posts',
  })

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['user-profile-favorites', userId, favoritesPage],
    queryFn: () => getUserFavorites(userId!, { page: favoritesPage, size: PAGE_SIZE }),
    enabled: isValidId(userId) && !!profile && tab === 'favorites',
  })

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return
      if (profile.isFollowing) {
        await unfollow(profile.id)
      } else {
        await follow(profile.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  const activeTitle = useMemo(() => (tab === 'favorites' ? '收藏' : '发布'), [tab])

  const actionLabel = profile?.isSelf
    ? '编辑资料'
    : isAuthenticated
      ? profile?.isFollowing ? '取消关注' : '关注'
      : '登录后关注'

  const ActionIcon = profile?.isSelf ? PenSquare : UserRoundPlus

  const updateTab = (nextTab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', nextTab)
    setSearchParams(next)
  }

  const updatePostsPage = (page: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'posts')
    next.set('postsPage', String(page))
    setSearchParams(next)
  }

  const updateFavoritesPage = (page: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'favorites')
    next.set('favoritesPage', String(page))
    setSearchParams(next)
  }

  if (!isValidId(userId)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Empty title="用户不存在" />
      </div>
    )
  }

  if (profileLoading) {
    return <Loading text="加载用户主页..." />
  }

  if (profileError || !profile) {
    const message = profileError instanceof Error ? profileError.message : '主页暂不可访问'
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Empty title="内容暂不可见" description={message} />
      </div>
    )
  }

  const handlePrimaryAction = () => {
    if (profile.isSelf) {
      navigate('/profile')
      return
    }
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    followMutation.mutate()
  }

  const renderPosts = () => {
    if (postsLoading) return <Loading text="加载发布内容..." />
    if (!posts || posts.records.length === 0) {
      return <Empty title="暂无发布内容" description="这里会展示该用户通过审核的公开帖子。" />
    }
    return (
      <>
        <div className="space-y-4">
          {posts.records.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <Pagination page={postsPage} size={PAGE_SIZE} total={posts.total} onChange={updatePostsPage} />
      </>
    )
  }

  const renderFavorites = () => {
    if (favoritesLoading) return <Loading text="加载收藏内容..." />
    if (!favorites || favorites.records.length === 0) {
      return <Empty title="暂无收藏内容" description="这里会展示该用户公开可见的帖子和游戏收藏。" />
    }
    return (
      <>
        <div className="space-y-4">
          {favorites.records.map((item) => (
            item.targetType === TARGET_TYPE.POST ? (
              <PostCard key={`${item.targetType}-${item.targetId}`} post={toPostResp(item)} badgeLabel="帖子收藏" />
            ) : (
              <FavoriteGameCard key={`${item.targetType}-${item.targetId}`} item={item} />
            )
          ))}
        </div>
        <Pagination page={favoritesPage} size={PAGE_SIZE} total={favorites.total} onChange={updateFavoritesPage} />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-[1190px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-lg bg-[#20242a] shadow-sm">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-[#111418]/80" />
        </div>
        <div className="relative px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <Avatar
                src={profile.avatarUrl}
                alt={profile.nickname}
                size="lg"
                className="h-24 w-24 rounded-2xl border-4 border-white/10"
              />
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-white">{profile.nickname}</h1>
                <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-white/70">
                  {profile.bio || '这个用户还没有写简介。'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={profile.isSelf ? 'primary' : 'outline'}
                onClick={handlePrimaryAction}
                loading={followMutation.isPending && !profile.isSelf && isAuthenticated}
              >
                <ActionIcon className="h-4 w-4" />
                {actionLabel}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="发布" value={profile.postCount} icon={PenSquare} />
            <StatTile label="收藏" value={profile.favoriteCount} icon={Heart} />
            <StatTile label="获赞" value={profile.likeCount} icon={ThumbsUp} />
            <StatTile label="粉丝" value={profile.followerCount} icon={Users} />
            <StatTile label="关注" value={profile.followingCount} icon={UserRoundPlus} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateTab('posts')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-bold transition-colors duration-200',
                  tab === 'posts' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-muted hover:text-text',
                )}
              >
                发布 {profile.postCount}
              </button>
              <button
                type="button"
                onClick={() => updateTab('favorites')}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-bold transition-colors duration-200',
                  tab === 'favorites' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-muted hover:text-text',
                )}
              >
                收藏 {profile.favoriteCount}
              </button>
            </div>
            <div className="text-xs text-text-secondary">当前查看：{activeTitle}</div>
          </div>

          <div className="rounded-b-lg bg-white p-4 shadow-sm">
            {tab === 'posts' ? renderPosts() : renderFavorites()}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <Card>
            <h2 className="text-sm font-semibold text-text">资料</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
              {profile.bio || '这个用户没有填写简介。'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
              <CalendarDays className="h-4 w-4" />
              注册于 {formatDateTime(profile.gmtCreate)}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text">统计</h2>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="flex items-center justify-between">
                <span>发布</span>
                <span className="font-semibold text-text">{profile.postCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>收藏</span>
                <span className="font-semibold text-text">{profile.favoriteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>获赞</span>
                <span className="font-semibold text-text">{profile.likeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>粉丝</span>
                <span className="font-semibold text-text">{profile.followerCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>关注</span>
                <span className="font-semibold text-text">{profile.followingCount}</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
