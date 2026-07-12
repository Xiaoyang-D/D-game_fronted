import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gamepad2 } from 'lucide-react'
import { register as registerApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(64),
  password: z.string().min(6, '密码至少 6 个字符').max(64),
  nickname: z.string().max(64).optional(),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  mobile: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const tokens = await registerApi({
        username: data.username,
        password: data.password,
        nickname: data.nickname || undefined,
        email: data.email || undefined,
        mobile: data.mobile || undefined,
      })
      setUser(tokens.user)
      toast('注册成功')
      navigate('/', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : '注册失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Gamepad2 className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-text">注册账号</h1>
          <p className="text-sm text-text-secondary">加入 D-Game 游戏社区</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="用户名" error={errors.username?.message} {...register('username')} />
          <Input label="密码" type="password" error={errors.password?.message} {...register('password')} />
          <Input label="昵称（可选）" error={errors.nickname?.message} {...register('nickname')} />
          <Input label="邮箱（可选）" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="手机号（可选）" error={errors.mobile?.message} {...register('mobile')} />
          <Button type="submit" loading={loading} className="w-full">注册</Button>
        </form>
        <p className="mt-4 text-center text-sm text-text-secondary">
          已有账号？{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover cursor-pointer">
            去登录
          </Link>
        </p>
      </Card>
    </div>
  )
}
