import { Fragment, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { auditPost, batchAuditPosts, deletePost, getPendingPosts } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/utils'
import type { Id, PostResp } from '@/types/api'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').slice(0, 120)
}

export function AdminAuditPostPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<Id>>(new Set())
  const [expandedId, setExpandedId] = useState<Id | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const size = 10

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pending-posts', page, size],
    queryFn: () => getPendingPosts({ page, size }),
  })

  const records = useMemo(() => data?.records ?? [], [data?.records])
  const allSelected = records.length > 0 && records.every((p) => selected.has(p.id))

  const selectedOnPage = useMemo(
    () => records.filter((p) => selected.has(p.id)),
    [records, selected],
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'pending-posts'] })
    setSelected(new Set())
  }

  const toggleOne = (id: Id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        records.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        records.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const handleSingleAudit = async (post: PostResp, approved: boolean) => {
    setLoading(true)
    try {
      await auditPost(post.id, { approved, reason: reason || undefined })
      toast(approved ? '帖子已通过审核' : '帖子已拒绝')
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : '审核失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (post: PostResp) => {
    if (!window.confirm(`确定删除帖子「${post.title}」吗？此操作不可恢复。`)) return
    setLoading(true)
    try {
      await deletePost(post.id)
      toast('帖子已删除')
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : '删除失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchAudit = async (approved: boolean) => {
    if (selected.size === 0) {
      toast('请先选择要审核的帖子', 'error')
      return
    }
    setLoading(true)
    try {
      await batchAuditPosts({
        postIds: Array.from(selected),
        approved,
        reason: reason || undefined,
      })
      toast(approved ? `已批量通过 ${selected.size} 篇帖子` : `已批量拒绝 ${selected.size} 篇帖子`)
      invalidate()
    } catch (err) {
      toast(err instanceof Error ? err.message : '批量审核失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">帖子审核</h1>
      <p className="mt-1 text-sm text-text-secondary">
        待审核帖子共 {data?.total ?? 0} 篇，支持单条或批量操作
      </p>

      <Card className="mt-6">
        <Textarea
          label="审核备注（可选，批量操作同样生效）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={() => handleBatchAudit(true)}
            loading={loading}
            disabled={selected.size === 0}
          >
            批量通过{selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
          <Button
            variant="danger"
            onClick={() => handleBatchAudit(false)}
            loading={loading}
            disabled={selected.size === 0}
          >
            批量拒绝{selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : records.length === 0 ? (
        <Empty title="暂无待审核帖子" description="所有帖子均已处理完毕" />
      ) : (
        <>
          <Card className="mt-6 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="全选当前页"
                        className="h-4 w-4 cursor-pointer rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-text">标题</th>
                    <th className="px-4 py-3 font-medium text-text">作者</th>
                    <th className="px-4 py-3 font-medium text-text">版块</th>
                    <th className="px-4 py-3 font-medium text-text">提交时间</th>
                    <th className="px-4 py-3 font-medium text-text">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((post) => (
                    <Fragment key={post.id}>
                      <tr className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(post.id)}
                            onChange={() => toggleOne(post.id)}
                            aria-label={`选择 ${post.title}`}
                            className="h-4 w-4 cursor-pointer rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                            className="text-left font-medium text-text hover:text-primary cursor-pointer"
                          >
                            {post.title}
                          </button>
                          <p className="mt-1 text-xs text-text-secondary line-clamp-1">
                            {stripHtml(post.content)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{post.authorNickname}</td>
                        <td className="px-4 py-3 text-text-secondary">{post.boardName}</td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {formatDateTime(post.gmtCreate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSingleAudit(post, true)}
                              loading={loading}
                            >
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleSingleAudit(post, false)}
                              loading={loading}
                            >
                              拒绝
                            </Button>
                            <Link
                              to={`/posts/${post.id}`}
                              className="inline-flex items-center text-xs text-primary hover:underline"
                              target="_blank"
                            >
                              预览
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(post)}
                              loading={loading}
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === post.id && (
                        <tr className="border-b border-border bg-muted/30">
                          <td colSpan={6} className="px-4 py-4">
                            <div
                              className="prose prose-sm max-w-none text-text-secondary"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {selectedOnPage.length > 0 && (
            <p className="mt-3 text-sm text-text-secondary">
              当前页已选 {selectedOnPage.length} 篇
            </p>
          )}

          {data && (
            <Pagination
              page={page}
              size={size}
              total={data.total}
              onChange={(p) => {
                setPage(p)
                setSelected(new Set())
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
