import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Grid3X3, Search } from 'lucide-react'
import { getGames } from '@/api/game'
import arknightsIcon from '@/assets/arknights.webp'
import endfieldIcon from '@/assets/arknights-endfield.webp'

export function NavbarSearch({ light = false }: { light?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [input, setInput] = useState(params.get('keyword') || '')
  const [gameId, setGameId] = useState<string | undefined>(params.get('gameId') || undefined)
  const [scopeOpen, setScopeOpen] = useState(false)
  const { data: gameList, isLoading, error } = useQuery({ queryKey: ['games', 'search-scopes'], queryFn: () => getGames({ page: 1, size: 100 }) })
  const selectedGame = gameList?.records.find(game => String(game.id) === gameId)
  const iconFor = (name: string, cover: string | null) => name.includes('终末地') ? endfieldIcon : name === '明日方舟' ? arknightsIcon : cover || undefined
  useEffect(() => {
    const next = new URLSearchParams(location.search)
    setInput(next.get('keyword') || '')
    setGameId(next.get('gameId') || undefined)
    setScopeOpen(false)
  }, [location.search])
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setScopeOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  function submit() {
    const keyword = input.trim()
    if (!keyword) return
    const next = new URLSearchParams({ keyword })
    if (gameId) next.set('gameId', gameId)
    setScopeOpen(false)
    navigate('/search?' + next.toString())
  }
  return <div ref={root} className={`relative w-full ${light ? '' : 'max-w-[450px]'}`} onKeyDown={event => { if (event.key === 'Escape') setScopeOpen(false) }}>
    <form onSubmit={event => { event.preventDefault(); submit() }} className={`flex items-center gap-3 rounded-full px-4 ${light ? 'h-16 border-2 border-primary bg-white text-text-secondary' : 'h-12 bg-white/5 text-white/60 focus-within:bg-white/10'}`}>
      <button type="button" aria-label={`搜索版区：${selectedGame?.name || '全部'}`} aria-expanded={scopeOpen} onClick={() => setScopeOpen(!scopeOpen)} className={`flex shrink-0 items-center gap-1 border-r pr-3 ${light ? 'border-border' : 'border-white/20 hover:text-white'}`}>
        {selectedGame && iconFor(selectedGame.name, selectedGame.coverUrl) ? <img src={iconFor(selectedGame.name, selectedGame.coverUrl)} alt="" className="h-8 w-8 rounded-full object-cover" /> : <Grid3X3 className="h-6 w-6" />}
        <ChevronDown className={`h-3 w-3 transition-transform ${scopeOpen ? 'rotate-180' : ''}`} />
      </button>
      <input aria-label="搜索游戏或帖子" value={input} maxLength={100} onChange={event => setInput(event.target.value)} onFocus={() => setScopeOpen(false)} placeholder="搜索你感兴趣的内容" className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${light ? 'text-text placeholder:text-text-secondary' : 'text-white placeholder:text-white/40'}`} />
      <button type="submit" aria-label="搜索" className={`shrink-0 ${light ? 'rounded-full bg-primary px-4 py-2 text-white' : 'p-1 hover:text-white'}`}><Search className="h-5 w-5" /></button>
    </form>
    {scopeOpen && <section aria-label="选择搜索版区" className="absolute right-0 top-full z-50 mt-3 w-full rounded-xl bg-[#303030] p-3 text-white/70 shadow-2xl">
      <button type="button" onClick={() => { setGameId(undefined); setScopeOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/10 ${!gameId ? 'text-primary' : ''}`}><Grid3X3 className="h-8 w-8 rounded-lg bg-primary p-1 text-white" />全部</button>
      {isLoading ? <p className="p-3 text-sm">正在加载版区…</p> : error ? <p className="p-3 text-sm">版区加载失败，请稍后重试</p> : gameList?.records.map(game => <button key={game.id} type="button" onClick={() => { setGameId(String(game.id)); setScopeOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/10 ${gameId === String(game.id) ? 'text-primary' : ''}`}>
        {iconFor(game.name, game.coverUrl) ? <img src={iconFor(game.name, game.coverUrl)} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <Grid3X3 className="h-8 w-8" />}{game.name}
      </button>)}
    </section>}
  </div>
}
