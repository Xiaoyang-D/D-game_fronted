import { Fragment, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { deletePost, getBannedAuthorPosts } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime, getContentStatusLabel, isValidId } from '@/lib/utils'
import type { Id } from '@/types/api'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').slice(0, 120)
}

export function AdminBannedPostsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [authorIdInput, setAuthorIdInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [authorId, setAuthorId] = useState<Id | undefined>()
  const [keyword, setKeyword] = useState('')
  const [expandedId, setExpandedId] = useState<Id | null>(null)
  const [loading, setLoading] = useState(false)
  const size = 10

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'banned-author-posts', page, size, authorId, keyword],
    queryFn: () => getBannedAuthorPosts({ page, size, authorId, keyword: keyword || undefined }),
  })

  const handleSearch = () => {
    const id = authorIdInput.trim()
    if (id && !isValidId(id)) {
      toast('请输入有效的作者 ID', 'error')
      return
    }
    setAuthorId(id || undefined)
    setKeyword(keywordInput.trim())
    setPage(1)
  }

  const handleDelete = async (postId: Id, title: string) => {
    if (!window.confirm(`确定删除帖子「${title}」吗？此操作不可恢复。`)) return
    setLoading(true)
    try {
      await deletePost(postId)
      toast('帖子已删除')
      queryClient.invalidateQueries({ queryKey: ['admin', 'banned-author-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-posts'] })
    } catch (err) {
      toast(err instanceof Error ? err.message : '删除失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const records = data?.records ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">封禁作者帖子</h1>
      <p className="mt-1 text-sm text-text-secondary">
        查看所有被封禁用户发布的帖子，共 {data?.total ?? 0} 篇
      </p>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="作者 ID"
              placeholder="输入被封禁用户的 ID"
              value={authorIdInput}
              onChange={(e) => setAuthorIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex-1">
            <Input
              label="作者昵称/用户名"
              placeholder="模糊搜索作者"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
            查询
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : records.length === 0 ? (
        <Empty
          title="暂无相关帖子"
          description="没有来自被封禁用户的帖子，或当前筛选条件下无结果"
        />
      ) : (
        <>
          <Card className="mt-6 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text">标题</th>
                    <th className="px-4 py-3 font-medium text-text">作者</th>
                    <th className="px-4 py-3 font-medium text-text">版块</th>
                    <th className="px-4 py-3 font-medium text-text">帖子状态</th>
                    <th className="px-4 py-3 font-medium text-text">发布时间</th>
                    <th className="px-4 py-3 font-medium text-text">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((post) => (
                    <Fragment key={post.id}>
                      <tr className="border-b border-border last:border-0">
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
                        <td className="px-4 py-3">
                          <p className="text-text">{post.authorNickname}</p>
                          <p className="text-xs text-text-secondary">
                            @{post.authorUsername ?? '-'} · ID: {post.userId}
                          </p>
                          <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                            已封禁
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{post.boardName}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {getContentStatusLabel(post.status)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {formatDateTime(post.gmtCreate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Link
                              to={`/posts/${post.id}`}
                              className="inline-flex items-center text-xs text-primary hover:underline"
                              target="_blank"
                            >
                              预览
                            </Link>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(post.id, post.title)}
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

          {data && (
            <Pagination page={page} size={size} total={data.total} onChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
