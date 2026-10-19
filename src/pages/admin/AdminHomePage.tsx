import { Link } from 'react-router-dom'
import { Gamepad2, MessageSquare, MessagesSquare, Shield, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const adminCards = [
  { to: '/admin/games/new', label: '创建游戏', desc: '添加新游戏到游戏库', icon: Gamepad2 },
  { to: '/admin/posts', label: '帖子管理', desc: '封禁或解封用户发表的帖子', icon: MessageSquare },
  { to: '/admin/moderation', label: '内容审核', desc: '审核帖子、评论、回复与个人简介', icon: MessagesSquare },
  { to: '/admin/moderation/rules', label: '审核规则词', desc: '管理即时生效的内容审核规则', icon: Shield },
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
