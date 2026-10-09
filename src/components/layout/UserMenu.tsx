import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, PenSquare, Settings, UserRound } from 'lucide-react'
import { getUserProfile } from '@/api/user'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: profile, isError, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: isAuthenticated && Boolean(user) && open,
  })

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const close = () => { cancelClose(); setOpen(false) }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => { setOpen(false); closeTimer.current = null }, 180)
  }

  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        if (closeTimer.current !== null) clearTimeout(closeTimer.current)
        setOpen(false)
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (closeTimer.current !== null) clearTimeout(closeTimer.current)
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  if (!isAuthenticated || !user) return null

  const links = [
    { to: `/users/${user.id}`, label: '我的主页', icon: UserRound },
    { to: '/posts/manage', label: '发布管理', icon: PenSquare },
    { to: '/profile', label: '设置', icon: Settings },
  ]
  const stats = [
    { label: '获赞', value: profile?.likeCount },
    { label: '粉丝', value: profile?.followerCount },
    { label: '关注', value: profile?.followingCount },
  ]
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      close()
      navigate('/login')
    } catch (error) {
      toast(error instanceof Error ? error.message : '退出登录失败，请重试', 'error')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div ref={containerRef} className="relative ml-2"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') { cancelClose(); setOpen(true) } }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') scheduleClose() }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close() }}>
      <button ref={buttonRef} type="button" aria-label="用户菜单" aria-expanded={open} aria-controls="user-menu-panel"
        onClick={() => { cancelClose(); setOpen(!open) }}
        className="flex rounded-full p-1 ring-2 ring-primary/60 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-primary">
        <Avatar src={user.avatarUrl} alt={user.nickname || user.username} size="md" />
      </button>
      {open && (
        <div id="user-menu-panel" className="nav-sections-reveal absolute right-0 top-full w-[300px] max-w-[calc(100vw-32px)] pt-3">
          <section aria-label="用户账户" className="overflow-hidden rounded-xl bg-[#292b29] p-6 text-white/70 shadow-2xl">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatarUrl} alt={user.nickname || user.username} size="md" className="h-12 w-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white/85">{user.nickname || user.username}</p>
                <p className="mt-1 break-all text-xs text-white/40">用户ID：{user.id}</p>
              </div>
            </div>
            <div className="my-6 grid grid-cols-3 gap-3 text-center" aria-busy={isLoading}>
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-bold text-white/80">{stat.value ?? '—'}</p>
                  <p className="mt-1 text-sm text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
            {isError && <p className="mb-3 text-xs text-white/40">暂时无法加载统计数据</p>}
            <nav aria-label="账户操作" className="-mx-2 space-y-1">
              {links.map((link) => (
                <Link key={link.to} to={link.to} onClick={close}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 text-base font-semibold transition-colors hover:bg-white/5 hover:text-primary">
                  <link.icon className="h-5 w-5" />{link.label}
                </Link>
              ))}
              <button type="button" onClick={handleLogout} disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-base font-semibold transition-colors hover:bg-white/5 hover:text-primary disabled:opacity-50">
                <LogOut className="h-5 w-5" />{loggingOut ? '正在退出…' : '退出登录'}
              </button>
            </nav>
          </section>
        </div>
      )}
    </div>
  )
}
