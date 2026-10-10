import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, LockKeyhole, ShieldCheck, UserRoundPen } from 'lucide-react'
import { updateProfile } from '@/api/user'
import { uploadFile } from '@/api/file'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const schema = z.object({
  nickname: z.string().trim().min(1, '请输入昵称').max(64, '昵称最多 64 个字符'),
  mobile: z.string(),
  bio: z.string().max(500, '简介最多 500 个字符'),
})
type FormData = z.infer<typeof schema>

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const privacy = searchParams.get('tab') === 'privacy'
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: user?.nickname || user?.username || '',
      mobile: user?.mobile || '', bio: user?.bio || '',
    },
  })
  const nickname = watch('nickname')
  const bio = watch('bio')
  const refreshProfile = () => queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast('请选择 JPG、PNG、GIF 或 WebP 图片', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('头像图片不能超过 10 MB', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await uploadFile(file)
      const updated = await updateProfile({ avatarUrl: result.fileUrl })
      setUser(updated)
      refreshProfile()
      toast('头像更新成功')
    } catch (error) {
      toast(error instanceof Error ? error.message : '上传失败', 'error')
    } finally { setUploading(false) }
  }
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const updated = await updateProfile(privacy
        ? { mobile: data.mobile || undefined }
        : { nickname: data.nickname, bio: data.bio })
      setUser(updated)
      refreshProfile()
      toast('设置已保存')
    } catch (error) {
      toast(error instanceof Error ? error.message : '保存失败', 'error')
    } finally { setLoading(false) }
  }
  if (!user) return null

  const tabs = [
    { id: 'profile', label: '编辑资料', icon: UserRoundPen },
    { id: 'privacy', label: '隐私设置', icon: LockKeyhole },
  ]
  return (
    <div className="mx-auto grid w-full max-w-[1190px] gap-4 px-4 py-5 md:grid-cols-[210px_minmax(0,1fr)] lg:px-0">
      <aside className="relative overflow-hidden rounded-xl bg-white p-4 shadow-sm md:min-h-[780px]">
        <h1 className="mb-6 text-lg font-black text-text">设置<span className="ml-1 text-base font-bold text-gray-300">SETTINGS<span className="text-primary">.</span></span></h1>
        <nav aria-label="设置分类" className="flex gap-2 md:flex-col">
          {tabs.map((tab) => {
            const selected = (privacy ? 'privacy' : 'profile') === tab.id
            return (
              <button key={tab.id} type="button" aria-current={selected ? 'page' : undefined}
                onClick={() => setSearchParams(tab.id === 'privacy' ? { tab: 'privacy' } : {})}
                className={cn('relative flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors md:flex-none', selected ? 'bg-primary/10 text-primary before:absolute before:left-0 before:h-5 before:w-[3px] before:rounded-full before:bg-primary' : 'text-text-secondary/65 hover:bg-muted hover:text-text')}>
                <tab.icon className="h-6 w-6" />{tab.label}
              </button>
            )
          })}
        </nav>
        <UserRoundPen aria-hidden="true" className="pointer-events-none absolute -bottom-7 -left-5 hidden h-36 w-36 -rotate-12 text-gray-100 md:block" />
      </aside>

      <section className="min-w-0 rounded-xl bg-white px-5 py-6 shadow-sm sm:px-8 md:min-h-[780px]">
        <h2 className="border-b border-border/60 pb-5 text-base font-bold text-text">{privacy ? '隐私设置' : '编辑资料'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-[680px] py-8 sm:py-10">
          {!privacy ? (
            <>
              <div className="mb-9 flex flex-col items-center gap-5">
                <Avatar src={user.avatarUrl} alt={user.nickname || user.username} size="lg" className="h-24 w-24 border-4 border-primary/10" />
                <Button type="button" variant="ghost" loading={uploading} disabled={loading}
                  onClick={() => fileRef.current?.click()} className="min-w-32 bg-gray-100 px-5 text-text hover:bg-gray-200">
                  <Camera className="h-4 w-4" />更换头像
                </Button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="space-y-7">
                <div className="grid gap-2 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-4">
                  <label htmlFor="settings-nickname" className="text-sm font-semibold sm:pt-3 sm:text-right">昵称</label>
                  <div className="relative">
                    <Input id="settings-nickname" maxLength={64} className="h-11 pr-16" error={errors.nickname?.message} {...register('nickname')} />
                    <span className="absolute right-3 top-3 text-xs text-gray-300">{nickname.length}/64</span>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-4">
                  <span className="text-sm font-semibold sm:pt-1 sm:text-right">用户名</span>
                  <div className="text-sm text-text-secondary">{user.username}<p className="mt-2 text-xs text-text-secondary/60">系统账号标识，登录请使用邮箱</p></div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-4">
                  <label htmlFor="settings-bio" className="text-sm font-semibold sm:pt-3 sm:text-right">个人简介</label>
                  <div>
                    <Textarea id="settings-bio" placeholder="写下你的个性签名…" rows={4} maxLength={500} error={errors.bio?.message} {...register('bio')} />
                    <p className="mt-2 text-right text-xs text-gray-300">{bio.length}/500</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-7">
              <div className="rounded-xl bg-primary/5 p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-text"><ShieldCheck className="h-5 w-5 text-primary" />你的资料公开范围</p>
                <p className="mt-3 text-sm leading-7 text-text-secondary">头像、昵称、简介和社区互动会展示在个人主页；邮箱和手机号不会展示在公开主页。</p>
                <Link to={`/users/${user.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">查看我的主页</Link>
              </div>
              <div className="text-sm"><p>邮箱：{user.email || '未绑定'}</p>
                <p className="mt-2 text-text-secondary">{user.emailVerifiedAt ? '已验证，暂不支持更换' : '未验证，请通过旧账号绑定邮箱入口完成验证'}</p>
                {!user.emailVerifiedAt && <Link to="/account-migration" className="text-primary">验证并绑定邮箱</Link>}
              </div>
              <Input label="手机号码" id="settings-mobile" type="tel" placeholder="输入手机号码" error={errors.mobile?.message} {...register('mobile')} />
              <p className="text-xs text-text-secondary">保存空白联系方式将保留原值。</p>
            </div>
          )}
          <div className="mt-10 flex justify-center sm:pl-24">
            <Button type="submit" loading={loading} disabled={uploading} className="h-11 w-full max-w-[214px] bg-[#c4ed28] font-bold text-[#28320b] hover:bg-[#b7df1e]">保存</Button>
          </div>
        </form>
      </section>
    </div>
  )
}
