import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Heart,
  Image,
  MessageSquare,
  PenSquare,
  Search,
  Star,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react'
import heroImage from '@/assets/hero.png'
import { getGames } from '@/api/game'
import { getBoards, getPosts } from '@/api/post'
import { CheckInCard } from '@/components/checkIn/CheckInCard'
import { PostCard } from '@/components/community/PostCard'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { useAuthStore } from '@/store/authStore'
import { formatRating } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { GameResp } from '@/types/api'

const toolLinks = [
  { to: '/community', label: '社区', icon: MessageSquare },
  { to: '/search', label: '搜索', icon: Search },
  { to: '/following', label: '关注流', icon: Users },
  { to: '/notifications', label: '通知', icon: Bell },
  { to: '/profile', label: '个人中心', icon: Heart },
]

interface HeroSlide {
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel: string
  secondaryTo: string
}

const defaultHeroSlides: HeroSlide[] = [
  {
    eyebrow: 'D-GAME COMMUNITY',
    title: '发现好游戏，分享游戏心得',
    description: '进入版区版区、参与讨论、发表攻略，把你的游戏经历沉淀成社区里的高光动态。',
    image: heroImage,
    imageAlt: 'D-Game',
    primaryLabel: '进入社区',
    primaryTo: '/community',
    secondaryLabel: '进入版区版区',
    secondaryTo: '/community',
  },
  {
    eyebrow: 'PLAYER FEED',
    title: '追踪玩家动态，发现新话题',
    description: '关注同好、收藏帖子、查看最新讨论，让每次打开首页都有新的游戏灵感。',
    image: heroImage,
    imageAlt: '社区动态',
    primaryLabel: '查看动态',
    primaryTo: '/community',
    secondaryLabel: '关注流',
    secondaryTo: '/following',
  },
  {
    eyebrow: 'GAME LIBRARY',
    title: '从评分与短评里挑下一款游戏',
    description: '游戏资料、玩家评价和相关讨论聚合在一起，快速找到值得投入时间的作品。',
    image: heroImage,
    imageAlt: '游戏版区',
    primaryLabel: '进入版区',
    primaryTo: '/community',
    secondaryLabel: '搜索内容',
    secondaryTo: '/search',
  },
]

export function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { data: boards, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 'home'],
    queryFn: () => getGames({ page: 1, size: 6 }),
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: () => getPosts({ page: 1, size: 8 }),
  })

  const featuredGame = games?.records[0]
  const heroSlides = useMemo(() => buildHeroSlides(games?.records), [games?.records])

  return (
    <div className="mx-auto grid max-w-[1190px] gap-4 px-4 sm:px-0 lg:grid-cols-[210px_minmax(0,1fr)_286px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 min-h-[520px] rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-text">
            首页<span className="ml-1 text-sm font-black text-border">D-GAME_</span>
          </h2>
          <nav className="mt-5 flex flex-col gap-2">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-md bg-primary/12 px-3 py-3 text-sm font-black text-primary"
            >
              <ArrowRight className="h-5 w-5" />
              推荐
            </Link>
            <Link
              to="/community"
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-text-secondary hover:bg-muted hover:text-text"
            >
              <Trophy className="h-5 w-5" />
              游戏版区
            </Link>
            <Link
              to="/community"
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-text-secondary hover:bg-muted hover:text-text"
            >
              <MessageSquare className="h-5 w-5" />
              社区动态
            </Link>
          </nav>

          <div className="mt-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">
              板块 BOARDS_
            </h3>
            <div className="mt-3 flex flex-col gap-1">
              {boardsLoading ? (
                <p className="px-3 py-2 text-sm text-text-secondary">加载中...</p>
              ) : (
                boards?.slice(0, 6).map((board) => (
                  <Link
                    key={board.id}
                    to={`/community?boardId=${board.id}`}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-muted hover:text-text"
                  >
                    {board.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
          <Link to="/" className="shrink-0 rounded-full bg-[#2d2d2d] px-4 py-2 text-sm font-bold text-white">
            推荐
          </Link>
          <Link to="/community" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-text-secondary">
            游戏版区
          </Link>
          <Link to="/community" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-text-secondary">
            社区
          </Link>
        </div>

        <HeroCarousel slides={heroSlides} />

        {isAuthenticated && (
          <section className="mt-4 lg:hidden">
            <CheckInCard />
          </section>
        )}

        <section className="mt-4 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-text">
              最新动态<span className="ml-1 text-sm text-border">FEED_</span>
            </h2>
            <Link to="/community" className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5">
            {postsLoading ? (
              <Loading />
            ) : posts && posts.records.length > 0 ? (
              <div className="flex flex-col gap-4">
                {posts.records.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Empty title="暂无帖子" />
            )}
          </div>
        </section>

        <section className="mt-4 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-text">
              最新游戏<span className="ml-1 text-sm text-border">GAMES_</span>
            </h2>
            <Link to="/community" className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {gamesLoading ? (
            <div className="mt-5">
              <Loading />
            </div>
          ) : games && games.records.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {games.records.slice(0, 4).map((game) => (
                <Link key={game.id} to={`/games/${game.id}`} className="group flex gap-3 rounded-md border border-border p-3 hover:border-primary/50">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {game.coverUrl ? (
                      <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gamepad2 className="h-7 w-7 text-border" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 font-black text-text group-hover:text-primary">{game.name}</h3>
                    <p className="mt-1 text-xs text-text-secondary">{game.categoryName}</p>
                    <p className="mt-2 flex items-center gap-1 text-sm font-bold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {formatRating(game.avgRating)} ({game.ratingCount})
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <Empty title="暂无游戏" />
            </div>
          )}
        </section>
      </main>

      <aside className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-4">
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-text">
              作品发布<span className="ml-1 text-sm text-border">POST_</span>
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Link to="/posts/new" className="flex flex-col items-center gap-2 rounded-md p-2 text-xs font-bold text-text-secondary hover:bg-muted hover:text-primary">
                <PenSquare className="h-8 w-8 text-primary" />
                发图文
              </Link>
              <Link to="/community" className="flex flex-col items-center gap-2 rounded-md p-2 text-xs font-bold text-text-secondary hover:bg-muted hover:text-primary">
                <Image className="h-8 w-8 text-primary" />
                发图集
              </Link>
              <Link to="/community" className="flex flex-col items-center gap-2 rounded-md p-2 text-xs font-bold text-text-secondary hover:bg-muted hover:text-primary">
                <BookOpen className="h-8 w-8 text-primary" />
                写攻略
              </Link>
            </div>
          </section>

          <section className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-text">
              工具箱<span className="ml-1 text-sm text-border">TOOLS_</span>
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-4">
              <div className="flex flex-col items-center gap-2 rounded-md p-2 text-xs font-bold text-text-secondary">
                <CalendarCheck className="h-8 w-8 text-primary" />
                签到福利
              </div>
              {toolLinks.slice(0, 5).map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2 rounded-md p-2 text-xs font-bold text-text-secondary hover:bg-muted hover:text-primary">
                    <Icon className="h-8 w-8 text-primary" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </section>

          {isAuthenticated ? (
            <CheckInCard />
          ) : (
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-text">
                加入社区<span className="ml-1 text-sm text-border">LOGIN_</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                登录后可发帖、关注动态、收藏游戏并领取每日签到奖励。
              </p>
              <div className="mt-4 flex gap-2">
                <Link to="/login" className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-black text-[#1f250c] hover:bg-primary-hover">
                  登录
                </Link>
                <Link to="/register" className="flex-1 rounded-md bg-muted px-3 py-2 text-center text-sm font-bold text-text hover:bg-border">
                  注册
                </Link>
              </div>
            </section>
          )}

          {featuredGame && (
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-text">
                今日推荐<span className="ml-1 text-sm text-border">PICK_</span>
              </h2>
              <Link to={`/games/${featuredGame.id}`} className="mt-4 block overflow-hidden rounded-md border border-border hover:border-primary/50">
                <div className="aspect-video bg-muted">
                  {featuredGame.coverUrl ? (
                    <img src={featuredGame.coverUrl} alt={featuredGame.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gamepad2 className="h-10 w-10 text-border" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 font-black text-text">{featuredGame.name}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{featuredGame.categoryName}</p>
                </div>
              </Link>
            </section>
          )}

          <section className="rounded-lg bg-white p-4 text-xs leading-6 text-text-secondary shadow-sm">
            <div className="flex items-center gap-2 font-black text-text">
              <Wrench className="h-4 w-4 text-primary" />
              D-Game 社区
            </div>
            <p className="mt-2">玩家创作、游戏评测与社区讨论聚合页面。</p>
          </section>
        </div>
      </aside>
    </div>
  )
}

function buildHeroSlides(games: GameResp[] = []): HeroSlide[] {
  const gameSlides = games.slice(0, 2).map((game, index) => ({
    eyebrow: index === 0 ? 'GAME PICK' : 'HOT GAME',
    title: game.name,
    description: game.description || `${game.categoryName} 玩家正在关注的作品，去看看评分、短评和相关讨论。`,
    image: game.coverUrl || heroImage,
    imageAlt: game.name,
    primaryLabel: '查看游戏',
    primaryTo: `/games/${game.id}`,
    secondaryLabel: '相关讨论',
    secondaryTo: `/community?gameId=${game.id}`,
  }))

  if (gameSlides.length === 0) return defaultHeroSlides
  if (gameSlides.length === 1) return [defaultHeroSlides[0], gameSlides[0], defaultHeroSlides[1]]
  return [defaultHeroSlides[0], ...gameSlides]
}

function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, slides.length])

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [isPaused, slides.length])

  const goToPrevious = () => {
    setActiveIndex((index) => (index + slides.length - 1) % slides.length)
  }

  const goToNext = () => {
    setActiveIndex((index) => (index + 1) % slides.length)
  }

  if (slides.length === 0) return null

  return (
    <section
      className="relative overflow-hidden rounded-lg bg-[#20242a] shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative min-h-[318px] sm:min-h-[264px]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={`${slide.eyebrow}-${slide.title}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={!isActive}
            >
              <img src={slide.image} alt={slide.imageAlt} className="absolute inset-0 h-full w-full object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#111418] via-[#111418]/80 to-[#111418]/20" />
              <div className="relative flex min-h-[318px] items-center px-6 py-8 pb-20 sm:min-h-[264px] sm:px-8 sm:pr-24">
                <div className="max-w-lg">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">{slide.eyebrow}</p>
                  <h1 className="mt-4 line-clamp-2 text-3xl font-black leading-tight text-white sm:text-4xl">
                    {slide.title}
                  </h1>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
                    {slide.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={slide.primaryTo}
                      tabIndex={isActive ? 0 : -1}
                      className="rounded-md bg-primary px-5 py-2.5 text-sm font-black text-[#1f250c] shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:bg-primary-hover"
                    >
                      {slide.primaryLabel}
                    </Link>
                    <Link
                      to={slide.secondaryTo}
                      tabIndex={isActive ? 0 : -1}
                      className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-bold text-white/85 hover:bg-white/10"
                    >
                      {slide.secondaryLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-5 left-6 z-10 flex items-center gap-2 sm:left-8">
            {slides.map((slide, index) => (
              <button
                key={`${slide.eyebrow}-${index}`}
                type="button"
                aria-label={`切换到第 ${index + 1} 张轮播图`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-200',
                  index === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-white/45 hover:bg-white/75',
                )}
              />
            ))}
          </div>

          <div className="absolute bottom-4 right-5 z-10 flex items-center gap-2">
            <button
              type="button"
              aria-label="上一张轮播图"
              onClick={goToPrevious}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/25 text-white/85 backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="下一张轮播图"
              onClick={goToNext}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/25 text-white/85 backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
