import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Gamepad2, Grid3X3, LogOut, Menu, PenSquare, Search, Settings, User, Users, X } from 'lucide-react'
import { useState } from 'react'
import { getUnreadCount } from '@/api/notification'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/games', label: '游戏库' },
  { to: '/community', label: '社区' },
]

export function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex h-[58px] max-w-[1190px] items-center justify-between rounded-lg bg-[#2d2d2d] px-4 shadow-[0_12px_30px_rgba(22,24,28,0.16)]">
        <Link to="/" className="flex min-w-0 items-center gap-2 cursor-pointer">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#2d2d2d]">
            <Gamepad2 className="h-6 w-6" />
          </span>
          <span className="text-lg font-black tracking-tight text-white">D-Game</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-white/45 sm:inline">
            player community
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-full items-center px-4 text-base font-bold transition-colors duration-200 cursor-pointer',
                  isActive ? 'text-white' : 'text-white/55 hover:text-white',
                  isActive &&
                    'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-1 after:rounded-t-full after:bg-primary',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden min-w-0 flex-1 justify-end md:flex">
          <Link
            to="/search"
            className="mr-3 flex h-10 w-full max-w-[360px] items-center gap-2 rounded-full bg-[#242424] px-4 text-sm text-white/35 transition-colors duration-200 hover:bg-[#202020] hover:text-white/60"
            aria-label="搜索"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="min-w-0 flex-1 truncate">搜索你感兴趣的内容</span>
            <Search className="h-4 w-4" />
          </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/posts/new"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white cursor-pointer"
              >
                <PenSquare className="h-4 w-4" />
                发帖
              </Link>
              <Link to="/following" className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/65 hover:bg-white/8 hover:text-white">
                <Users className="h-4 w-4" />关注动态
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
              <Link
                to={`/users/${user!.id}`}
                className="ml-1 flex items-center gap-2 rounded-full bg-white/8 px-2 py-1.5 transition-colors duration-200 hover:bg-white/12 cursor-pointer"
              >
                <Avatar src={user?.avatarUrl} size="sm" />
                <span className="max-w-20 truncate text-sm font-semibold text-white">{user?.nickname}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-white/55 transition-colors duration-200 hover:bg-white/8 hover:text-white cursor-pointer"
                aria-label="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </button>
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
          className="rounded-md p-2 text-white/75 transition-colors duration-200 hover:bg-white/8 md:hidden cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-[1190px] rounded-lg bg-[#2d2d2d] px-4 py-3 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
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
            <NavLink to="/search" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-bold text-white/70 cursor-pointer">
              搜索
            </NavLink>
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
