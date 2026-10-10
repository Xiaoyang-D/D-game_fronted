import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register, resetPassword, sendEmailCode, verifyMigration, sendMigrationCode, bindMigration } from '@/api/auth'
import { clearAuthTokens } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

const emailSchema = z.string().trim().max(128).email('请输入有效邮箱')
const passwordSchema = z.string().min(6, '密码至少 6 个字符').max(64, '密码最多 64 个字符')

export function EmailAuthForm({ mode }: { mode: 'register' | 'reset' | 'migration' }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const setUser = useAuthStore((state) => state.setUser)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [migrationToken, setMigrationToken] = useState('')
  const [migrationExpiresAt, setMigrationExpiresAt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const migrating = mode === 'migration'
  const credentialsStep = migrating && !migrationToken
  const title = mode === 'register' ? '注册账号' : mode === 'reset' ? '找回密码' : '旧账号绑定邮箱'

  useEffect(() => {
    if (!remaining) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])
  useEffect(() => {
    if (!migrationToken) return
    const timer = window.setTimeout(() => {
      setMigrationToken(''); setCode(''); setPassword('')
      toast('迁移凭证已过期，请重新验证原账号', 'error')
    }, Math.max(0, migrationExpiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [migrationToken, migrationExpiresAt, toast])

  const send = async () => {
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) { toast('请输入有效邮箱', 'error'); return }
    setSending(true)
    try {
      if (migrating) await sendMigrationCode(migrationToken, parsed.data)
      else await sendEmailCode(parsed.data, mode === 'register' ? 'REGISTER' : 'RESET_PASSWORD')
      setRemaining(60)
      toast('若邮箱符合条件，验证码将发送至该邮箱，请检查收件箱和垃圾邮件')
    } catch (error) { toast(error instanceof Error ? error.message : '发送失败', 'error') }
    finally { setSending(false) }
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (credentialsStep) {
        if (!username.trim() || !password) throw new Error('请输入原用户名和密码')
        const result = await verifyMigration(username, password)
        setMigrationToken(result.migrationToken)
        setMigrationExpiresAt(Date.now() + result.expiresIn * 1000)
        setPassword('')
        return
      }
      const parsed = emailSchema.safeParse(email)
      if (!parsed.success) throw new Error('请输入有效邮箱')
      if (!/^[0-9]{6}$/.test(code)) throw new Error('请输入 6 位数字验证码')
      if (!migrating) {
        const checked = passwordSchema.safeParse(password)
        if (!checked.success) throw new Error(checked.error.issues[0].message)
        if (password !== confirmation) throw new Error('两次密码输入不一致')
      }
      if (mode === 'reset') {
        await resetPassword(parsed.data, code, password)
        clearAuthTokens(); setUser(null)
        toast('密码已重置，请重新登录'); navigate('/login', { replace: true })
      } else {
        if (mode === 'register' && (!nickname.trim() || nickname.trim().length > 64)) throw new Error('昵称需为 1 至 64 个字符')
        const tokens = migrating
          ? await bindMigration(migrationToken, parsed.data, code)
          : await register({ email: parsed.data, code, password, nickname: nickname.trim() })
        setUser(tokens.user); toast(migrating ? '邮箱绑定成功' : '注册成功')
        navigate('/', { replace: true })
      }
    } catch (error) { toast(error instanceof Error ? error.message : '操作失败', 'error') }
    finally { setBusy(false) }
  }
  return <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
    <Card className="w-full max-w-md">
      <h1 className="mb-3 text-center text-2xl font-bold">{title}</h1>
      {migrating && <p className="mb-4 text-sm text-text-secondary">先验证原账号，再绑定属于你的邮箱。社区数据和账号权限会保留。</p>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        {credentialsStep ? <>
          <Input label="原用户名" value={username} maxLength={64} autoComplete="username" required onChange={(event) => setUsername(event.target.value)} />
          <Input label="原密码" type="password" value={password} autoComplete="current-password" required onChange={(event) => setPassword(event.target.value)} />
        </> : <>
          <Input label="邮箱" type="email" autoComplete="email" value={email} maxLength={128} required onChange={(event) => { setEmail(event.target.value); setCode('') }} />
          <div className="flex items-end gap-2">
            <Input label="验证码" value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required onChange={(event) => setCode(event.target.value)} />
            <Button type="button" loading={sending} disabled={busy || remaining > 0} onClick={send}>{remaining ? `${remaining} 秒后重发` : '发送验证码'}</Button>
          </div>
          {!migrating && <>
            <Input label={mode === 'reset' ? '新密码' : '密码'} type="password" value={password} minLength={6} maxLength={64} autoComplete="new-password" required onChange={(event) => setPassword(event.target.value)} />
            <Input label="确认密码" type="password" value={confirmation} minLength={6} maxLength={64} autoComplete="new-password" required onChange={(event) => setConfirmation(event.target.value)} />
          </>}
          {mode === 'register' && <Input label="昵称" value={nickname} maxLength={64} required onChange={(event) => setNickname(event.target.value)} />}
        </>}
        <Button type="submit" loading={busy} disabled={sending}>{credentialsStep ? '验证原账号' : mode === 'register' ? '注册' : mode === 'reset' ? '重置密码' : '验证并绑定'}</Button>
        {migrating && migrationToken && <Button type="button" variant="ghost" onClick={() => { setMigrationToken(''); setCode('') }}>重新验证原账号</Button>}
      </form>
      <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary">返回邮箱登录</Link></p>
    </Card>
  </div>
}
