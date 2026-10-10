import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gamepad2 } from 'lucide-react'
import { login } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().trim().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少 6 个字符'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const tokens = await login(data)
      setUser(tokens.user)
      toast('登录成功')
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : '登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Gamepad2 className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-text">登录 D-Game</h1>
          <p className="text-sm text-text-secondary">欢迎回到游戏社区</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="邮箱" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="密码" type="password" error={errors.password?.message} {...register('password')} />
          <Button type="submit" loading={loading} className="w-full">登录</Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-primary">
          <Link to="/forgot-password">忘记密码</Link>
          <Link to="/account-migration">旧账号绑定邮箱</Link>
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          还没有账号？{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover cursor-pointer">
            立即注册
          </Link>
        </p>
      </Card>
    </div>
  )
}
