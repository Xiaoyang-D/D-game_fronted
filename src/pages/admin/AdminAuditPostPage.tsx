import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { auditPost, getAdminPosts } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import type { PostResp } from '@/types/api'

export function AdminAuditPostPage() {
  const { toast } = useToast()
  const client = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<number | undefined>()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'posts', page, status], queryFn: () => getAdminPosts({ page, size: 10, status }) })
  async function change(post: PostResp, approved: boolean) {
    setLoading(true)
    try {
      await auditPost(post.id, { approved, reason: reason.trim() || undefined })
      toast(approved ? '帖子已恢复公开' : '帖子已封禁')
      await client.invalidateQueries()
      setReason('')
    } catch (err) { toast(err instanceof Error ? err.message : '操作失败', 'error') }
    finally { setLoading(false) }
  }
  return <div>
    <h1 className="text-2xl font-bold text-text">帖子管理</h1>
    <p className="mt-1 text-sm text-text-secondary">发布后自动公开；封禁后隐藏，只有管理员解封才能恢复。</p>
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap gap-3">{[{ label: '全部', value: undefined }, { label: '已发布', value: 2 }, { label: '已封禁', value: 3 }, { label: '历史待审核', value: 1 }].map(tab => <Button key={tab.label} variant={status === tab.value ? 'primary' : 'outline'} onClick={() => { setStatus(tab.value); setPage(1) }}>{tab.label}</Button>)}</div>
      <Textarea label="管理备注（可选，将通知作者）" maxLength={500} value={reason} onChange={e => setReason(e.target.value)} />
    </Card>
    {isLoading ? <Loading /> : error ? <p className="mt-6 text-red-500">{error.message}</p> : !data?.records.length ? <Empty title="暂无帖子" /> : <>
      <Card className="mt-6 overflow-x-auto p-0"><table className="w-full min-w-[600px] text-left text-sm">
        <thead><tr>{['标题', '作者', '版块', '状态', '操作'].map(label => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.records.map(post => <tr key={post.id} className="border-t border-border">
          <td className="px-4 py-3">{post.title}</td><td className="px-4 py-3">{post.authorNickname}</td><td className="px-4 py-3">{post.boardName}</td>
          <td className="px-4 py-3">{post.status === 3 ? '已封禁' : post.status === 2 ? '已发布' : '历史待审核'}</td>
          <td className="px-4 py-3"><div className="flex items-center gap-3">
            {post.status !== 2 && <Button size="sm" loading={loading} onClick={() => change(post, true)}>{post.status === 3 ? '解封' : '公开'}</Button>}
            {post.status !== 3 && <Button size="sm" variant="danger" loading={loading} onClick={() => change(post, false)}>封禁</Button>}
            <Link to={`/posts/${post.id}`} target="_blank" className="text-primary hover:underline">查看</Link>
          </div></td>
        </tr>)}</tbody>
      </table></Card><Pagination page={page} size={10} total={data.total} onChange={setPage} />
    </>}
  </div>
}
