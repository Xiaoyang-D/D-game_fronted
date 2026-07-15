import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  Heart,
  ImageOff,
  MessageCircle,
  PenLine,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import emptyPublishing from '@/assets/empty-publishing.png'
import { deleteManagedPost, getPostManagement } from '@/api/post'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'
import { cn, formatDateTime } from '@/lib/utils'
import type { PostManageItem, PostManageTab } from '@/types/api'

const PAGE_SIZE = 10

// Keep the URL tab names independent from backend numeric status codes.
const tabs: Array<{ key: PostManageTab; label: string; countKey: 'publishedCount' | 'pendingCount' | 'rejectedCount' | 'draftCount' }> = [
  { key: 'published', label: '已发布', countKey: 'publishedCount' },
  { key: 'pending', label: '审核中', countKey: 'pendingCount' },
  { key: 'rejected', label: '未通过', countKey: 'rejectedCount' },
  { key: 'draft', label: '草稿', countKey: 'draftCount' },
]

function getTab(value: string | null): PostManageTab {
  return tabs.some((tab) => tab.key === value) ? value as PostManageTab : 'published'
}

function getPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function firstImageSrc(html: string): string | null {
  // Management rows use the first rich-text image as a lightweight thumbnail.
  return /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] || null
}

export function PostManagementPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const tab = getTab(searchParams.get('tab'))
  const page = getPage(searchParams.get('page'))
  const { data, isLoading, error } = useQuery({
    queryKey: ['post-management', tab, page],
    queryFn: () => getPostManagement({ tab, page, size: PAGE_SIZE }),
  })

  const changeTab = (nextTab: PostManageTab) => {
    setSearchParams({ tab: nextTab, page: '1' })
  }

  const changePage = (nextPage: number) => {
    setSearchParams({ tab, page: String(nextPage) })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteManagedPost,
    onSuccess: (_result, id) => {
      const removedLastRecord = data?.records.length === 1 && page > 1
      queryClient.invalidateQueries({ queryKey: ['post-management'] })
      queryClient.removeQueries({ queryKey: ['managed-post', id] })
      toast('帖子已删除')
      if (removedLastRecord) changePage(page - 1)
    },
    onError: (mutationError: Error) => toast(mutationError.message, 'error'),
    onSettled: () => setDeletingId(null),
  })

  const editPost = (post: PostManageItem) => {
    // Drafts retain their partial-save workflow; submitted posts use the reviewable edit path.
    navigate(post.status === 0 ? `/posts/new?draftId=${post.id}` : `/posts/new?postId=${post.id}`)
  }

  const removePost = (post: PostManageItem) => {
    if (!window.confirm(`确定删除「${post.title || '未命名帖子'}」吗？此操作不可恢复。`)) return
    setDeletingId(post.id)
    deleteMutation.mutate(post.id)
  }

  if (isLoading) return <Loading text="加载发布管理..." />
  if (error) return <Empty title="发布管理暂不可用" description={error instanceof Error ? error.message : '加载失败'} />

  return (
    <div className="mx-auto max-w-[1190px] px-4 py-5 sm:px-6 lg:px-0 lg:py-7">
      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-lg bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h1 className="text-xl font-black text-text">
            发布管理<span className="ml-1 text-base text-text-secondary/35">MANAGE</span><span className="text-primary">_</span>
          </h1>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="发布管理分类">
            <button type="button" className="relative shrink-0 rounded-lg bg-primary/10 px-4 py-3 text-left text-base font-bold text-primary before:absolute before:bottom-3 before:left-0 before:top-3 before:w-1 before:rounded-r-full before:bg-primary">
              管理图文
            </button>
            <span className="shrink-0 px-4 py-3 text-base text-text-secondary/65" aria-disabled="true">管理图集</span>
            <span className="shrink-0 px-4 py-3 text-base text-text-secondary/65" aria-disabled="true">管理视频</span>
            <span className="shrink-0 px-4 py-3 text-base text-text-secondary/65" aria-disabled="true">管理合集</span>
          </nav>
        </aside>

        <section className="min-w-0 rounded-lg bg-white px-5 py-4 shadow-sm sm:px-7 sm:py-5">
          <div role="tablist" aria-label="发布状态" className="flex min-w-max gap-6 overflow-x-auto border-b border-border sm:gap-12">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => changeTab(item.key)}
                className={cn(
                  'relative shrink-0 px-1 pb-4 text-lg font-medium text-text-secondary transition-colors duration-200',
                  tab === item.key && 'font-black text-text after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-primary',
                )}
              >
                {item.label} {data?.[item.countKey] ?? 0}
              </button>
            ))}
          </div>

          {data && data.records.length > 0 ? (
            <div className="divide-y divide-border">
              {data.records.map((post) => (
                <PostManagementRow
                  key={post.id}
                  post={post}
                  deleting={deletingId === post.id && deleteMutation.isPending}
                  onEdit={() => editPost(post)}
                  onDelete={() => removePost(post)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[480px] flex-col items-center justify-center py-12 text-center">
              <img src={emptyPublishing} alt="" className="h-auto w-36 object-contain sm:w-40" />
              <p className="mt-3 text-base text-text-secondary/55">这里空空如也</p>
            </div>
          )}

          {data && data.total > 0 && (
            <Pagination page={page} size={PAGE_SIZE} total={data.total} onChange={changePage} />
          )}
        </section>
      </div>
    </div>
  )
}

function PostManagementRow({
  post,
  deleting,
  onEdit,
  onDelete,
}: {
  post: PostManageItem
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const imageSrc = firstImageSrc(post.content)
  const isDraft = post.status === 0
  const timeLabel = isDraft ? '修改于' : '发布于'
  const timestamp = isDraft ? post.gmtModified : post.gmtCreate

  return (
    <article className="grid gap-4 py-5 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
      <button type="button" onClick={onEdit} className="aspect-[16/10] w-full overflow-hidden rounded-md bg-muted text-left sm:w-40">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-text-secondary/35">
            <ImageOff className="h-8 w-8" />
          </span>
        )}
      </button>

      <div className="min-w-0">
        <button type="button" onClick={onEdit} className="max-w-full truncate text-left text-lg font-black text-text transition-colors hover:text-primary">
          {post.title || '未命名草稿'}
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          <span>{timeLabel} {formatDateTime(timestamp)}</span>
          {post.boardName && <span>· {post.boardName}</span>}
          {post.gameName && <span>· {post.gameName}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-secondary">
          <Metric icon={Eye} value={post.viewCount} />
          <Metric icon={MessageCircle} value={post.commentCount} />
          <Metric icon={ThumbsUp} value={post.likeCount} />
          <Metric icon={Heart} value={post.favoriteCount} />
          {isDraft && post.scheduledPublishAt && <span className="inline-flex items-center gap-1 text-primary">定时 {formatDateTime(post.scheduledPublishAt)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:self-start sm:pt-1">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover">
          <PenLine className="h-4 w-4" />编辑
        </button>
        <Button type="button" variant="ghost" size="sm" title="删除帖子" aria-label="删除帖子" loading={deleting} onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </article>
  )
}

function Metric({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  return <span className="inline-flex items-center gap-1"><Icon className="h-4 w-4" />{value}</span>
}
