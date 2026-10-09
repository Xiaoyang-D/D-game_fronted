import { Link } from 'react-router-dom'
import { Gamepad2, MessageSquare, MessagesSquare, Shield, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const adminCards = [
  { to: '/admin/games/new', label: '创建游戏', desc: '添加新游戏到游戏库', icon: Gamepad2 },
  { to: '/admin/posts', label: '帖子管理', desc: '封禁或解封用户发表的帖子', icon: MessageSquare },
  { to: '/admin/comments', label: '评论审核', desc: '审核用户发表的评论', icon: MessagesSquare },
  { to: '/admin/users', label: '用户管理', desc: '封禁/解封用户，分配角色', icon: Users },
]

export function AdminHomePage() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text">管理后台</h1>
          <p className="text-sm text-text-secondary">管理平台内容和用户</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {adminCards.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">{card.label}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{card.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
