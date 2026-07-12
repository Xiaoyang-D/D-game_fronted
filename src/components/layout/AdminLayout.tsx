import { NavLink, Outlet } from 'react-router-dom'
import { Gamepad2, MessageSquare, MessagesSquare, Shield, UserX, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminLinks = [
  { to: '/admin', label: '概览', icon: Shield, end: true },
  { to: '/admin/games/new', label: '创建游戏', icon: Gamepad2 },
  { to: '/admin/posts', label: '帖子审核', icon: MessageSquare },
  { to: '/admin/posts/banned', label: '封禁作者帖子', icon: UserX },
  { to: '/admin/comments', label: '评论审核', icon: MessagesSquare },
  { to: '/admin/users', label: '用户管理', icon: Users },
]

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 shrink-0">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer',
                    isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-muted hover:text-text',
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
