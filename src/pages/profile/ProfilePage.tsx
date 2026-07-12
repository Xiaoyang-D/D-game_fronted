import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera } from 'lucide-react'
import { updateProfile } from '@/api/user'
import { uploadFile } from '@/api/file'
import { CheckInCard } from '@/components/checkIn/CheckInCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'

const schema = z.object({
  nickname: z.string().max(64).optional(),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  mobile: z.string().optional(),
  bio: z.string().max(500, '简介最多 500 个字符').optional(),
})

type FormData = z.infer<typeof schema>

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      nickname: user?.nickname || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      bio: user?.bio || '',
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('仅支持图片格式', 'error')
      return
    }

    setUploading(true)
    try {
      const result = await uploadFile(file)
      const updated = await updateProfile({ avatarUrl: result.fileUrl })
      setUser(updated)
      toast('头像更新成功')
    } catch (err) {
      toast(err instanceof Error ? err.message : '上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const updated = await updateProfile({
        nickname: data.nickname || undefined,
        email: data.email || undefined,
        mobile: data.mobile || undefined,
        bio: data.bio || undefined,
      })
      setUser(updated)
      toast('资料更新成功')
    } catch (err) {
      toast(err instanceof Error ? err.message : '更新失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text">个人中心</h1>

      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={user.avatarUrl} size="lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white cursor-pointer transition-colors duration-200 hover:bg-primary-hover"
              aria-label="上传头像"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">{user.nickname}</h2>
            <p className="text-sm text-text-secondary">@{user.username}</p>
            <p className="mt-1 text-xs text-text-secondary">
              注册于 {formatDateTime(user.gmtCreate)}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <CheckInCard />
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-text">编辑资料</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
          <Input label="昵称" error={errors.nickname?.message} {...register('nickname')} />
          <Input label="邮箱" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="手机号码" error={errors.mobile?.message} {...register('mobile')} />
          <Textarea label="个人简介" error={errors.bio?.message} {...register('bio')} />
          <Button type="submit" loading={loading}>保存修改</Button>
        </form>
      </Card>
    </div>
  )
}
