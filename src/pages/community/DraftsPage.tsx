import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, FileText, Trash2 } from 'lucide-react'
import { deleteDraft, getDrafts } from '@/api/post'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 10

export function DraftsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useQuery({
    queryKey: ['post-drafts', page],
    queryFn: () => getDrafts({ page, size: PAGE_SIZE }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-drafts'] })
      toast('草稿已删除')
    },
    onError: (mutationError: Error) => toast(mutationError.message, 'error'),
  })

  if (isLoading) return <Loading text="加载草稿箱..." />
  if (error) return <Empty title="草稿箱暂不可用" description={error instanceof Error ? error.message : '加载失败'} />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">DRAFTS</p>
          <h1 className="mt-2 text-2xl font-black text-text">草稿箱</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/posts/new')}>
          <FileText className="h-4 w-4" />新建帖子
        </Button>
      </header>

      {data && data.records.length > 0 ? (
        <>
          <div className="mt-6 space-y-3">
            {data.records.map((draft) => (
              <article key={draft.id} className="flex flex-col gap-4 rounded-lg border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => navigate(`/posts/new?draftId=${draft.id}`)} className="min-w-0 text-left">
                  <h2 className="truncate text-lg font-black text-text hover:text-primary">{draft.title || '未命名草稿'}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span>{draft.boardName || '未选择版区'}</span>
                    <span>修改于 {formatDateTime(draft.gmtModified)}</span>
                    {draft.scheduledPublishAt && (
                      <span className="inline-flex items-center gap-1 text-primary"><Clock3 className="h-3.5 w-3.5" />定时 {formatDateTime(draft.scheduledPublishAt)}</span>
                    )}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  title="删除草稿"
                  aria-label="删除草稿"
                  loading={deleteMutation.isPending && deleteMutation.variables === draft.id}
                  onClick={() => {
                    if (window.confirm('确定删除这份草稿吗？')) deleteMutation.mutate(draft.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </article>
            ))}
          </div>
          <Pagination page={page} size={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      ) : (
        <div className="mt-8 rounded-lg bg-white p-10 shadow-sm">
          <Empty title="暂无草稿" description="保存正在编辑的内容后，会在这里继续完成发布。" />
        </div>
      )}
    </div>
  )
}
