import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, Gamepad2, MapPin, Menu, PenSquare, Settings, User, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getGames } from '@/api/game'
import { Pagination } from '@/components/ui/Pagination'
import { getUnreadCount } from '@/api/notification'
import { useAuthStore } from '@/store/authStore'
import { UserMenu } from '@/components/layout/UserMenu'
import { NavbarSearch } from '@/components/layout/NavbarSearch'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: '首页' },
]

export function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<'home' | 'sections' | null>(null)
  const [gamesPage, setGamesPage] = useState(1)
  const location = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  const sectionsButtonRef = useRef<HTMLButtonElement>(null)
  const sectionsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelSectionsClose = () => {
    if (sectionsCloseTimer.current !== null) {
      clearTimeout(sectionsCloseTimer.current)
      sectionsCloseTimer.current = null
    }
  }
  const openSectionsOnHover = () => {
    cancelSectionsClose()
    setSectionsOpen(true)
  }
  const scheduleSectionsClose = () => {
    cancelSectionsClose()
    sectionsCloseTimer.current = setTimeout(() => {
      setSectionsOpen(false)
      sectionsCloseTimer.current = null
    }, 180)
  }
  useEffect(() => () => {
    if (sectionsCloseTimer.current !== null) clearTimeout(sectionsCloseTimer.current)
  }, [])
  const selectedGameId = new URLSearchParams(location.search).get('gameId')
  const sectionsActive = (location.pathname === '/community' || location.pathname === '/search' || /^\/posts\/[^/]+$/.test(location.pathname) && !['/posts/new', '/posts/manage', '/posts/drafts'].includes(location.pathname))
  const highlightedNav = hoveredNav ?? (sectionsOpen || sectionsActive ? 'sections' : location.pathname === '/' ? 'home' : null)
  const { data: games, isLoading: gamesLoading, isError: gamesError, refetch: reloadGames } = useQuery({
    staleTime: 0, queryKey: ['nav-game-sections', gamesPage],
    queryFn: () => getGames({ page: gamesPage, size: 12 }),
    enabled: sectionsOpen,
  })

  useEffect(() => {
    if (!sectionsOpen && !mobileOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setSectionsOpen(false)
        setMobileOpen(false)
        if (sectionsCloseTimer.current !== null) clearTimeout(sectionsCloseTimer.current)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSectionsOpen(false)
        setMobileOpen(false)
        if (sectionsCloseTimer.current !== null) clearTimeout(sectionsCloseTimer.current)
        sectionsButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [sectionsOpen, mobileOpen])

  const closeMenus = () => {
    cancelSectionsClose()
    setSectionsOpen(false)
    setMobileOpen(false)
  }

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header ref={headerRef} onClick={(event) => { if ((event.target as HTMLElement).closest('a')) closeMenus() }} className={cn(
      'sticky z-40 bg-[#333333] shadow-[0_8px_24px_rgba(0,0,0,0.15)]',
      (location.pathname === '/' || location.pathname === '/community' || location.pathname === '/search' || /^\/posts\/[^/]+$/.test(location.pathname) && !['/posts/new', '/posts/manage', '/posts/drafts'].includes(location.pathname))
        ? cn('community-navbar rounded-2xl', location.pathname === '/' && 'home-navbar')
        : 'top-0',
    )}>
      <div className={cn('mx-auto flex max-w-[1500px] items-center gap-4 px-5 sm:px-8', (location.pathname === '/' || location.pathname === '/community' || location.pathname === '/search' || /^\/posts\/[^/]+$/.test(location.pathname) && !['/posts/new', '/posts/manage', '/posts/drafts'].includes(location.pathname)) ? 'h-[68px]' : 'h-20')}>
        <Link to="/" onClick={closeMenus} className="flex min-w-0 shrink-0 items-center gap-2 cursor-pointer">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#2d2d2d]">
            <Gamepad2 className="h-6 w-6" />
          </span>
          <span className="text-lg font-black tracking-tight text-white">D-Game</span>
        </Link>

        <nav className="hidden h-full items-center gap-1 lg:flex" onPointerLeave={() => setHoveredNav(null)}>
          {navLinks.filter((link) => link.to === '/').map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={closeMenus}
              onPointerEnter={(event) => { if (event.pointerType === 'mouse') { setHoveredNav('home'); closeMenus() } }}
              className={() =>
                cn(
                  'relative flex h-full items-center px-4 text-xl font-black transition-colors duration-200 cursor-pointer',
                  highlightedNav === 'home' ? 'text-white' : 'text-white/55 hover:text-white',
                  (highlightedNav === 'home') &&
                    'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-1 after:rounded-t-full after:bg-primary',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            ref={sectionsButtonRef}
            type="button"
            aria-expanded={sectionsOpen}
            aria-controls="game-sections-panel"
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') { setHoveredNav('sections'); openSectionsOnHover() } }}
            onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleSectionsClose() }}
            onClick={() => { cancelSectionsClose(); setSectionsOpen(!sectionsOpen) }}
            className={cn('relative flex h-full cursor-pointer items-center gap-2 px-4 text-xl font-black transition-colors duration-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-4px]',
              highlightedNav === 'sections' ? 'text-white after:absolute after:bottom-0 after:left-6 after:right-6 after:h-1 after:rounded-full after:bg-primary' : 'text-white/60 hover:text-white')}
          >
            版区 <ChevronDown className={cn('h-5 w-5 rounded-full bg-white/5 transition-transform', sectionsOpen && 'rotate-180')} />
          </button>
        </nav>

        <div className="hidden min-w-0 flex-1 justify-end lg:flex">
          <NavbarSearch />
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/posts/new"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white cursor-pointer"
              >
                <PenSquare className="h-4 w-4" />
                发帖
              </Link>
              <Link to="/following" aria-label="关注动态" className="flex items-center gap-1 rounded-md p-2 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white">
                <Users className="h-5 w-5" />
              </Link>
              <Link
                to="/notifications"
                className="relative flex items-center rounded-md p-2 text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white cursor-pointer"
                aria-label="通知"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  管理
                </Link>
              )}
              <UserMenu />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-md bg-primary px-5 py-2 text-sm font-black text-[#1f250c] shadow-[0_4px_0_rgba(0,0,0,0.18)] transition-colors duration-200 hover:bg-primary-hover"
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-md px-4 py-2 text-sm font-bold text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white"
              >
                注册
              </button>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-white/75 transition-colors duration-200 hover:bg-white/8 lg:hidden cursor-pointer"
          onClick={() => { setMobileOpen(!mobileOpen); setSectionsOpen(false) }}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {sectionsOpen && (
        <section id="game-sections-panel" aria-label="游戏版区"
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') cancelSectionsClose() }}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleSectionsClose() }}
          className="nav-sections-reveal absolute left-0 right-0 top-full border-t border-white/5 bg-[#292929] shadow-2xl">
          <div className="mx-auto max-h-[70vh] max-w-[1190px] overflow-y-auto px-6 py-7">
            <div className="mb-5 flex items-center justify-between text-sm">
              <span className="font-semibold text-white/40">选择你感兴趣的游戏版区</span>
              <div className="flex gap-5">
              </div>
            </div>
            {gamesLoading ? <p className="py-8 text-center text-white/50">正在加载版区…</p> : gamesError ? (
              <div className="py-8 text-center text-white/60">版区加载失败 <button onClick={() => reloadGames()} className="ml-3 text-primary">重试</button></div>
            ) : !games?.records.length ? <p className="py-8 text-center text-white/50">暂无游戏版区</p> : (
              <>
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {games.records.map((game) => (
                    <Link key={game.id} to={`/community?gameId=${encodeURIComponent(game.id)}`} onClick={closeMenus}
                      aria-current={sectionsActive && selectedGameId === game.id ? 'page' : undefined}
                      className={cn('flex items-center gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-white/5',
                        sectionsActive && selectedGameId === game.id ? 'bg-white/5 text-primary' : 'text-white/65 hover:text-white')}>
                      <MapPin className="h-4 w-4 shrink-0 text-white/20" />
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                        {game.iconUrl || game.coverUrl ? <img src={game.iconUrl || game.coverUrl!} alt="" className="h-full w-full object-contain" /> : <Gamepad2 className="h-7 w-7 text-primary" />}
                      </span>
                      <span className="truncate text-lg font-bold">{game.name}</span>
                    </Link>
                  ))}
                </div>
                <Pagination page={gamesPage} size={12} total={games.total} onChange={setGamesPage} />
              </>
            )}
          </div>
        </section>
      )}

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-[1190px] rounded-lg bg-[#2d2d2d] px-4 py-3 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            <button type="button" onClick={() => { setMobileOpen(false); setSectionsOpen(true) }} className="rounded-md px-3 py-2 text-left font-bold text-white">游戏版区 <ChevronDown className="inline h-4 w-4" /></button>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-bold cursor-pointer',
                    isActive ? 'bg-primary text-[#1f250c]' : 'text-white/70',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavbarSearch />
            {isAuthenticated ? (
              <>
                <NavLink to="/posts/new" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                  发帖
                </NavLink>
                <NavLink to="/notifications" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                  通知 {unreadCount > 0 && `(${unreadCount})`}
                </NavLink>
                <NavLink to={`/users/${user!.id}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                  <User className="h-4 w-4" /> 个人中心
                </NavLink>
                {isAdmin() && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                    管理后台
                  </NavLink>
                )}
                <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm text-red-300 cursor-pointer">
                  退出登录
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                  登录
                </NavLink>
                <NavLink to="/register" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-white/70 cursor-pointer">
                  注册
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
