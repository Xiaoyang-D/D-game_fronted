import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { banUser, unbanUser, getRoles, assignRole } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { isValidId } from '@/lib/utils'
import type { Id } from '@/types/api'

export function AdminUsersPage() {
  const { toast } = useToast()
  const [userId, setUserId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: getRoles,
  })

  const getUserId = (): Id | null => {
    const id = userId.trim()
    if (!isValidId(id)) {
      toast('请输入有效的用户 ID', 'error')
      return null
    }
    return id
  }

  const handleBan = async () => {
    const id = getUserId()
    if (!id) return
    setLoading(true)
    try {
      await banUser(id)
      toast('用户已封禁')
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUnban = async () => {
    const id = getUserId()
    if (!id) return
    setLoading(true)
    try {
      await unbanUser(id)
      toast('用户已解封')
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    const id = getUserId()
    if (!id) return
    if (!isValidId(roleId)) {
      toast('请选择角色', 'error')
      return
    }
    setLoading(true)
    try {
      await assignRole({ userId: id, roleId })
      toast('角色分配成功')
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <Loading />

  const roleOptions = [
    { value: '', label: '请选择角色' },
    ...(roles?.map((r) => ({ value: r.id, label: `${r.roleName} (${r.roleCode})` })) || []),
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">用户管理</h1>
      <p className="mt-1 text-sm text-text-secondary">按用户 ID 进行封禁、解封和角色分配</p>

      <Card className="mt-6">
        <Input
          label="用户 ID"
          placeholder="输入用户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="danger" onClick={handleBan} loading={loading}>封禁用户</Button>
          <Button variant="outline" onClick={handleUnban} loading={loading}>解封用户</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-semibold text-text">分配角色</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="角色"
              options={roleOptions}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            />
          </div>
          <Button onClick={handleAssignRole} loading={loading}>分配角色</Button>
        </div>
      </Card>

      {roles && roles.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold text-text">角色列表</h2>
          <div className="mt-4 flex flex-col gap-2">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <span className="font-medium text-text">{role.roleName}</span>
                  <span className="ml-2 text-sm text-text-secondary">({role.roleCode})</span>
                </div>
                <span className="text-xs text-text-secondary">ID: {role.id}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
