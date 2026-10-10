
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, BookOpen, ChevronRight, Gamepad2, Layers3, MessageSquare, PenSquare, Sparkles, Megaphone, Swords, Handshake, Palette, Camera } from 'lucide-react'
import { getBoards, getPosts } from '@/api/post'
import { getGame } from '@/api/game'

import { PublishCard } from '@/components/community/PublishCard'
import { PostCard } from '@/components/community/PostCard'

import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import arknightsIcon from '@/assets/arknights.webp'
import endfieldIcon from '@/assets/arknights-endfield.webp'

export function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const gameId = searchParams.get('gameId') || undefined
  const boardId = searchParams.get('boardId') || undefined
  const recommended = !boardId && searchParams.get('section') !== 'forum'
  const sortParam = searchParams.get('sort')
  const sort = sortParam === 'LATEST' || sortParam === 'LATEST_REPLY' ? sortParam : 'DEFAULT'
  const { data: boards } = useQuery({ queryKey: ['boards'], queryFn: getBoards })

  const searchKeyword = searchParams.get('keyword') || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const { data: game } = useQuery({ queryKey: ['game', gameId], queryFn: () => getGame(gameId!), enabled: Boolean(gameId) })
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', { boardId, gameId, recommended, sort, keyword: searchKeyword, page, size: 10 }],
    queryFn: () => getPosts({ boardId, gameId, recommended, sort, keyword: searchKeyword || undefined, page, size: 10 }),
  })
  function setPage(nextPage: number) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (nextPage > 1) next.set('page', String(nextPage)); else next.delete('page')
      return next
    })
  }
  const isEndfield = game?.name.includes('终末地')
  const icon = isEndfield ? endfieldIcon : arknightsIcon
  const name = gameId ? game?.name || '游戏版区' : '全部社区'
  const englishName = gameId ? isEndfield ? 'ARKNIGHTS ENDFIELD' : 'ARKNIGHTS' : 'D-GAME COMMUNITY'
  const publishParams = new URLSearchParams()
  if (gameId) publishParams.set('gameId', gameId)
  if (boardId) publishParams.set('boardId', boardId)
  const publishUrl = '/posts/new?' + publishParams.toString()

  return (
    <div className="community-shell">
      <section className={`community-hero relative mb-4 flex items-center overflow-hidden rounded-2xl px-6 py-5 sm:px-8 ${isEndfield ? 'bg-[#eaf67b]' : 'bg-[#d4efec]'}`}>
        <div className="absolute -right-16 -top-28 h-[470px] w-[470px] rotate-12 border-[50px] border-white/40" />
        <div className="absolute bottom-4 right-8 select-none text-[100px] font-black leading-none tracking-tighter text-white/45 sm:text-[150px]" aria-hidden="true">{isEndfield ? 'ENDFIELD' : 'ARKNIGHTS'}</div>
        {gameId && <img src={icon} alt="" className="absolute right-5 top-1/2 h-32 w-32 -translate-y-1/2 rotate-6 rounded-2xl object-contain opacity-30 sm:right-10 sm:h-40 sm:w-40 sm:rounded-3xl sm:opacity-80" />}
        <div className="relative max-w-xl">
          <span className="text-xs font-bold tracking-[0.28em] text-slate-700">{englishName}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-700">在这里交流游戏心得，分享你的发现与冒险。</p>
          <a href="#community-feed" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-900">探索版区 <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </section>

      <div className="community-columns grid items-start">
        <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:min-h-[calc(100vh-120px)]">
          <div className="flex items-center gap-3 lg:block">
            {gameId && <img src={icon} alt={`${name}图标`} className="h-10 w-10 rounded-xl object-cover lg:hidden" />}
            <div><h2 className="text-lg font-black text-text">{name}</h2><p className="mt-1 text-xs font-bold tracking-wide text-text-secondary">{englishName}<span className="text-primary">.</span></p></div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2 lg:flex-col" aria-label="版区分区">
            {[{ name: '推荐', id: undefined, Icon: Layers3 }, ...(boards || []).map(board => ({ name: board.name, id: board.id, Icon: ({ '论坛': MessageSquare, '官方': Megaphone, '攻略': Swords, '互助': Handshake, '同人': Palette, 'COS': Camera } as Record<string, typeof Layers3>)[board.name] || MessageSquare }))].map(section => {
              const selected = section.id ? boardId === String(section.id) : recommended
              const Icon = section.Icon
              return <button key={section.name} type="button" aria-current={selected ? 'page' : undefined} onClick={() => {

                setSearchParams(previous => {
                const next = new URLSearchParams(previous)
                next.delete('page'); next.delete('keyword'); next.delete('sort')
                if (section.id) { next.set('boardId', String(section.id)); next.set('section', 'forum') }
                else { next.delete('boardId'); next.delete('section') }
                return next
                })
              }} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-bold transition-colors ${selected ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-muted'}`}><Icon className="h-6 w-6" />{section.name}</button>
            })}
          </nav>
          <div className="mt-8 hidden border-t border-border pt-5 text-xs leading-6 text-text-secondary lg:block">分享有价值的内容，尊重每一位玩家。一起建设属于我们的游戏社区。</div>
        </aside>

        <div className="min-w-0">
          {!recommended && <section className="rounded-2xl bg-white p-4 shadow-sm" aria-label="分区横幅">
            <div className={`relative flex min-h-40 items-center justify-between gap-4 overflow-hidden rounded-xl px-6 py-5 ${isEndfield ? 'bg-[#f1f6d8]' : 'bg-[#e5f4f2]'}`}>
              <div className="relative z-10">
                <p className="text-xs font-bold tracking-widest text-text-secondary">{englishName}</p>
                <h2 className="mt-3 text-2xl font-black text-text">{boards?.find(board => String(board.id) === boardId)?.name || '论坛'}</h2>
                <p className="mt-2 text-sm text-text-secondary">分享你的创作，发现同好的精彩内容</p>
              </div>
              <img src={icon} alt="" className="h-28 w-28 shrink-0 rounded-2xl object-contain" />
            </div>
          </section>}

          {recommended && <section id="community-highlights" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm">
            <div className={`relative overflow-hidden rounded-xl p-6 ${isEndfield ? 'bg-[#f1f6d8]' : 'bg-[#e5f4f2]'}`}>
              <Sparkles className="absolute -right-3 -top-3 h-28 w-28 text-primary/15" />
              <p className="text-xs font-bold tracking-widest text-text-secondary">COMMUNITY / {englishName}</p>
              <h2 className="relative mt-3 text-xl font-black text-text">每一次分享，都让冒险更精彩</h2>
              <p className="relative mt-2 text-sm text-text-secondary">发现新内容，与同好一起交流。</p>
            </div>
            <div className="mt-3 divide-y divide-border">{data?.records.slice(0, 3).map(post => <Link key={post.id} to={`/posts/${post.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-primary"><span className="shrink-0 rounded border border-primary/30 px-2 py-0.5 text-xs text-primary">动态</span><span className="truncate">{post.title}</span><ChevronRight className="ml-auto h-4 w-4 shrink-0" /></Link>)}</div>
          </section>}
          <section id="community-feed" className={`mt-4 scroll-mt-24 ${!recommended ? 'rounded-2xl bg-white p-5 shadow-sm' : ''}`}>
            {!recommended && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <h2 className="text-sm font-bold text-text">排序</h2>
              <div className="flex rounded-full bg-muted p-1" role="group" aria-label="帖子排序">
                {([{ value: 'DEFAULT', label: '默认' }, { value: 'LATEST', label: '最新发布' }, { value: 'LATEST_REPLY', label: '最新回复' }] as const).map(option => <button key={option.value} type="button" aria-pressed={sort === option.value} onClick={() => setSearchParams(previous => {
                  const next = new URLSearchParams(previous)
                  next.set('sort', option.value); next.delete('page')
                  return next
                })} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${sort === option.value ? 'bg-white font-bold text-text shadow-sm' : 'text-text-secondary hover:text-text'}`}>{option.label}</button>)}
              </div>
            </div>}
            {isLoading ? <Loading /> : error ? <div className="rounded-2xl bg-white p-6 text-red-600">{error.message}</div> : data?.records.length ? <><div className="flex flex-col gap-4">{data.records.map(post => <PostCard key={post.id} post={post} className={recommended ? 'rounded-2xl' : 'rounded-none px-0 shadow-none hover:shadow-none border-b border-border last:border-0'} />)}</div><Pagination page={page} size={10} total={data.total} onChange={setPage} /></> : <div className="rounded-2xl bg-white p-8 shadow-sm"><Empty title="暂无帖子" description={searchKeyword ? '试试其他关键词' : '分享你的第一篇游戏心得吧'} /><Link to={publishUrl} className="mx-auto mt-2 flex w-fit items-center gap-2 text-sm font-bold text-primary"><PenSquare className="h-4 w-4" />发布帖子</Link></div>}
          </section>
        </div>

        <aside className="community-tools flex flex-col gap-4">
          <PublishCard publishUrl={publishUrl} />
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-text">快捷入口 <span className="text-sm text-text-secondary/40">TOOLS<span className="text-primary">.</span></span></h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {gameId && <Link to={`/community?gameId=${gameId}`} className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 px-2 py-4 text-xs text-text-secondary hover:bg-primary/10"><Gamepad2 className="h-7 w-7 text-primary" />游戏版区</Link>}
              <Link to="/assistant" className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 px-2 py-4 text-xs text-text-secondary hover:bg-primary/10"><Sparkles className="h-7 w-7 text-primary" />游戏助手</Link>
              <Link to="/posts/manage" className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 px-2 py-4 text-xs text-text-secondary hover:bg-primary/10"><BookOpen className="h-7 w-7 text-primary" />发布管理</Link>
            </div>
          </section>
          <section className="rounded-2xl bg-white p-5 text-sm leading-7 text-text-secondary shadow-sm"><h2 className="mb-2 font-black text-text">关于版区</h2>只展示当前游戏的帖子，发布后自动公开。请友善交流，遵守社区规范。</section>
        </aside>
      </div>
    </div>
  )
}
