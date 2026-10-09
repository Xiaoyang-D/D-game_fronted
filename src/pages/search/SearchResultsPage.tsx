import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, PenSquare, FileText, Sparkles, Trash2 } from 'lucide-react'
import { search } from '@/api/search'
import { getBoards } from '@/api/post'
import { NavbarSearch } from '@/components/layout/NavbarSearch'
import { PostCard } from '@/components/community/PostCard'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'

const historyKey = 'd-game-search-history'
function readHistory(): string[] {
  try { const saved: unknown = JSON.parse(localStorage.getItem(historyKey) || '[]'); return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string').slice(0, 10) : [] } catch { return [] }
}
export function SearchResultsPage() {
  const [params, setParams] = useSearchParams()
  const keyword = (params.get('keyword') || params.get('q') || '').trim()
  const gameId = params.get('gameId') || undefined
  const tab = params.get('tab') || 'all'
  const hot = params.get('sort') !== 'latest'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [history, setHistory] = useState(readHistory)
  const { data: boards } = useQuery({ queryKey: ['boards'], queryFn: getBoards })
  const guideId = boards?.find(board => board.name === '攻略')?.id
  const { data, isLoading, error } = useQuery({
    queryKey: ['search-results', keyword, gameId, tab, hot, page, guideId],
    queryFn: () => search({ keyword, gameId, type: tab === 'all' && !gameId ? 'ALL' : 'POST', boardId: tab === 'guide' ? guideId : undefined, recommended: hot, page, size: 10 }),
    enabled: Boolean(keyword) && (tab !== 'guide' || Boolean(guideId)),
  })
  useEffect(() => {
    if (!keyword) return
    const next = [keyword, ...readHistory().filter(item => item !== keyword)].slice(0, 10)
    setHistory(next)
    try { localStorage.setItem(historyKey, JSON.stringify(next)) } catch { /* Storage may be unavailable. */ }
  }, [keyword])
  function update(key: string, value: string) { setParams(previous => { const next = new URLSearchParams(previous); next.set(key, value); next.delete('page'); return next }) }
  const total = Math.max(data?.posts?.total || 0, data?.games?.total || 0)
  const publishUrl = '/posts/new' + (gameId ? '?gameId=' + encodeURIComponent(gameId) : '')
  return <div className="community-shell grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
    <main className="min-w-0">
      <NavbarSearch light />
      <section className="mt-3 rounded-2xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex gap-4">{[{ key: 'all', label: '综合' }, { key: 'guide', label: '攻略' }, { key: 'post', label: '帖子' }].map(item => <button key={item.key} onClick={() => update('tab', item.key)} className={`border-b-2 pb-2 text-sm ${tab === item.key ? 'border-primary font-bold text-text' : 'border-transparent text-text-secondary'}`}>{item.label}</button>)}</div>
          <div className="flex rounded-full bg-muted p-1 text-xs">{[{ key: 'hot', label: '最热' }, { key: 'latest', label: '最新' }].map(item => <button key={item.key} onClick={() => update('sort', item.key)} className={`rounded-full px-3 py-1 ${(hot ? 'hot' : 'latest') === item.key ? 'bg-white text-text shadow-sm' : 'text-text-secondary'}`}>{item.label}</button>)}</div>
        </div>
        {!keyword ? <Empty title="在搜索栏输入关键词开始搜索" /> : isLoading ? <Loading /> : error ? <p className="p-6 text-red-600">{error.message}</p> : <>
          {data?.games?.records.map(game => <Link key={game.id} to={`/community?gameId=${game.id}`} className="mb-3 block rounded-xl bg-muted px-4 py-3 text-sm font-bold">{game.name} <span className="ml-2 font-normal text-text-secondary">进入版区 →</span></Link>)}
          <div className="divide-y divide-border">{data?.posts?.records.map(post => <PostCard key={post.id} post={post} compact className="rounded-none px-0 shadow-none hover:shadow-none" />)}</div>
          {!data?.posts?.records.length && !data?.games?.records.length && <Empty title="没有找到相关内容" description="试试其他关键词或切换版区" />}
          <Pagination page={page} size={10} total={total} onChange={value => setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(value)); return next })} />
        </>}
      </section>
    </main>
    <aside className="space-y-3 lg:sticky lg:top-28">
      <section className="rounded-2xl bg-white p-5"><h2 className="text-lg font-bold">搜索 <span className="text-text-secondary/40">SEARCH<span className="text-primary">.</span></span></h2>
        <div className="mt-5 flex items-center justify-between text-sm text-text-secondary"><span className="flex items-center gap-2"><Clock className="h-4 w-4" />历史记录</span><button className="flex items-center gap-1 text-xs" onClick={() => { setHistory([]); try { localStorage.removeItem(historyKey) } catch { /* Keep clearing available in memory. */ } }}><Trash2 className="h-3 w-3" />清空</button></div>
        <div className="mt-3 flex flex-wrap gap-2">{history.map(item => <button key={item} onClick={() => update('keyword', item)} className="rounded-full bg-muted px-3 py-1.5 text-xs text-text-secondary hover:text-primary">{item}</button>)}{!history.length && <p className="text-xs text-text-secondary">暂无搜索记录</p>}</div>
      </section>
      <section className="rounded-2xl bg-white p-5"><h2 className="text-lg font-bold">作品发布 <span className="text-text-secondary/40">POST<span className="text-primary">.</span></span></h2><Link to={publishUrl} className="mt-5 flex flex-col items-center gap-2 py-3 text-sm text-primary"><PenSquare className="h-9 w-9" />发布图文</Link><Link to="/posts/manage?tab=draft" className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-4 text-sm text-text-secondary"><FileText className="h-4 w-4" />草稿箱</Link></section>
      <section className="rounded-2xl bg-white p-5"><h2 className="text-lg font-bold">快捷入口</h2><Link to="/assistant" className="mt-4 flex items-center gap-3 rounded-xl bg-muted p-4 text-sm text-text-secondary"><Sparkles className="h-6 w-6 text-primary" />游戏助手</Link></section>
    </aside>
  </div>
}
