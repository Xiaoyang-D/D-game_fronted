import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, FileText, Plus, Search, Sparkles } from 'lucide-react'
import { getGames } from '@/api/game'
import {
  getBoards,
  getDraft,
  getManagedPost,
  getPostTopics,
  publishDraft,
  publishPost,
  saveDraft,
  updateManagedPost,
  updateDraft,
} from '@/api/post'
import { createMyCollection, getMyCollections } from '@/api/user'
import { RichTextEditor } from '@/components/community/RichTextEditor'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { isValidId } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { PostPublishReq } from '@/types/api'
import { plainTextLength } from '@/lib/richText'

const TITLE_LIMIT = 40
const CONTENT_LIMIT = 20000

function toLocalDateTimeValue(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value
    return result
  }, {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function toShanghaiDateTimeInput(value: string): string {
  return value.length >= 16 ? value.slice(0, 16) : value
}

export function CreatePostPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isAuthenticated, isAdmin } = useAuthStore()
  const draftId = searchParams.get('draftId')
  const postId = searchParams.get('postId')
  const managedPostId = !draftId && isValidId(postId) ? postId : null
  const initialGameId = searchParams.get('gameId') || ''

  const [boardId, setBoardId] = useState(searchParams.get('boardId') || '')
  const [gameId, setGameId] = useState(initialGameId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicNames, setTopicNames] = useState<string[]>([])
  const [topicQuery, setTopicQuery] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isOriginal, setIsOriginal] = useState(false)
  const [containsAiGenerated, setContainsAiGenerated] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduleBaseTime] = useState(() => Date.now())

  const { data: boards, isLoading: boardsLoading } = useQuery({
    staleTime: 0, queryKey: ['boards', gameId],
    queryFn: () => getBoards(gameId || undefined),
  })
  const { data: games } = useQuery({
    staleTime: 0, queryKey: ['games', 'post-options'],
    queryFn: () => getGames({ page: 1, size: 100 }),
  })
  const { data: collections } = useQuery({
    queryKey: ['my-collections'],
    queryFn: getMyCollections,
    enabled: isAuthenticated,
  })
  const { data: topics } = useQuery({
    queryKey: ['post-topics', topicQuery],
    queryFn: () => getPostTopics(topicQuery || undefined),
  })
  const { data: draft, isLoading: draftLoading, error: draftError } = useQuery({
    queryKey: ['post-draft', draftId],
    queryFn: () => getDraft(draftId!),
    enabled: isValidId(draftId),
  })
  const { data: managedPost, isLoading: managedPostLoading, error: managedPostError } = useQuery({
    queryKey: ['managed-post', managedPostId],
    queryFn: () => getManagedPost(managedPostId!),
    enabled: managedPostId !== null,
  })

  useEffect(() => {
    const source = draft || managedPost
    if (!source) return
    // Draft data arrives asynchronously; synchronize it into the controlled editor fields once loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardId(source.boardId || '')
    setGameId(source.gameId || '')
    setTitle(source.title || '')
    setContent(source.content || '')
    setTopicNames(source.topics.map((topic) => topic.name))
    setCollectionId(source.collectionId || '')
    setIsOriginal(source.isOriginal)
    setContainsAiGenerated(source.containsAiGenerated)
    setScheduleEnabled(Boolean(source.scheduledPublishAt))
    setScheduledAt(source.scheduledPublishAt ? toShanghaiDateTimeInput(source.scheduledPublishAt) : '')
  }, [draft, managedPost])

  const minScheduleAt = useMemo(() => toLocalDateTimeValue(new Date(scheduleBaseTime + 2 * 60 * 60 * 1000)), [scheduleBaseTime])
  const maxScheduleAt = useMemo(() => toLocalDateTimeValue(new Date(scheduleBaseTime + 15 * 24 * 60 * 60 * 1000)), [scheduleBaseTime])

  const buildDraftPayload = () => ({
    boardId: boardId || undefined,
    gameId: gameId || undefined,
    title,
    content,
    topicNames,
    collectionId: collectionId || undefined,
    isOriginal,
    containsAiGenerated,
    scheduledPublishAt: scheduleEnabled && scheduledAt ? scheduledAt : undefined,
  })

  const saveMutation = useMutation({
    mutationFn: () => draftId ? updateDraft(draftId, buildDraftPayload()) : saveDraft(buildDraftPayload()),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['post-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['post-management'] })
      toast('草稿已保存')
      if (!draftId) {
        navigate(`/posts/new?draftId=${saved.id}`, { replace: true })
      }
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const publishMutation = useMutation({
    mutationFn: (request: PostPublishReq) => draftId ? publishDraft(draftId, request) : publishPost(request),
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['post-management'] })
      if (scheduleEnabled) {
        toast('定时发布已保存，到期后自动公开')
        navigate('/posts/manage?tab=draft')
      } else {
        toast('帖子已发布')
        navigate(`/posts/${postId}`)
      }
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const managedUpdateMutation = useMutation({
    mutationFn: (request: PostPublishReq) => updateManagedPost(managedPostId!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-management'] })
      queryClient.invalidateQueries({ queryKey: ['managed-post', managedPostId] })
      toast('修改已保存，封禁状态不会因修改而解除')
      navigate('/posts/manage')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const createCollectionMutation = useMutation({
    mutationFn: (name: string) => createMyCollection(name),
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ['my-collections'] })
      setCollectionId(collection.id)
      toast('合集已创建')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  if (!isAuthenticated) return null
  if (boardsLoading || draftLoading || managedPostLoading) return <Loading text="加载发帖工作台..." />
  if (draftError || managedPostError) {
    const error = draftError || managedPostError
    return <Empty title="内容暂不可用" description={error instanceof Error ? error.message : '无法加载内容'} />
  }

  const boardOptions = [
    { value: '', label: '请选择分区' },
    ...(boards?.filter((board) => board.publishPolicy !== 'ADMIN' || isAdmin()).map((board) => ({ value: String(board.id), label: board.name })) || []),
  ]
  const gameOptions = [
    { value: '', label: '不关联游戏' },
    ...(games?.records.map((game) => ({ value: String(game.id), label: game.name })) || []),
  ]
  const collectionOptions = [
    { value: '', label: '不加入合集' },
    ...(collections?.map((collection) => ({ value: String(collection.id), label: collection.name })) || []),
  ]

  const addTopic = (rawName: string) => {
    const normalized = rawName.trim().replace(/^#/, '')
    if (!normalized) return
    if (topicNames.includes(normalized)) {
      setTopicQuery('')
      return
    }
    if (topicNames.length >= 5) {
      toast('最多添加5个话题', 'error')
      return
    }
    if (normalized.length > 64) {
      toast('话题长度不能超过64个字符', 'error')
      return
    }
    setTopicNames((current) => [...current, normalized])
    setTopicQuery('')
  }

  const handleCreateCollection = () => {
    const name = window.prompt('请输入合集名称')?.trim()
    if (name) createCollectionMutation.mutate(name)
  }

  const handlePublish = () => {
    if (!boardId || !title.trim() || plainTextLength(content) === 0) {
      toast('请填写标题、正文并选择版区', 'error')
      return
    }
    if (title.trim().length > TITLE_LIMIT || plainTextLength(content) > CONTENT_LIMIT) {
      toast('标题或正文超过长度限制', 'error')
      return
    }
    if (scheduleEnabled && !scheduledAt) {
      toast('请选择定时发布时间', 'error')
      return
    }
    const request: PostPublishReq = {
      boardId,
      gameId: gameId || undefined,
      title: title.trim(),
      content,
      topicNames,
      collectionId: collectionId || undefined,
      isOriginal,
      containsAiGenerated,
      scheduledPublishAt: scheduleEnabled ? scheduledAt : undefined,
    }
    if (managedPostId) {
      managedUpdateMutation.mutate({ ...request, scheduledPublishAt: undefined })
    } else {
      publishMutation.mutate(request)
    }
  }

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">D-GAME COMMUNITY</p>
          <h1 className="mt-2 text-2xl font-black text-text">{managedPostId ? '编辑图文' : '发布图文'}</h1>
        </div>
        <Link to="/posts/manage?tab=draft" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary">
          <FileText className="h-4 w-4" />
          草稿箱
        </Link>
      </header>

      <main className="mt-6 space-y-7">
        <section>
          <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
            <input
              value={title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="请输入标题（必填）"
              className="min-w-0 flex-1 bg-transparent text-lg font-bold text-text outline-none placeholder:text-text-secondary/50"
            />
            <span className="ml-3 shrink-0 text-xs text-text-secondary">{title.length}/{TITLE_LIMIT}</span>
          </div>
        </section>

        <section>
          <RichTextEditor value={content} onChange={setContent} placeholder="畅所欲言，笔送给你（建议1-20000字）" maxLength={CONTENT_LIMIT} />
        </section>

        <section className="space-y-6">
          <div className="max-w-md">
            <FieldHeading label="选择版区" />
            <Select value={boardId} options={boardOptions} onChange={(event) => setBoardId(event.target.value)} />
          </div>

          <div className="max-w-xl">
            <FieldHeading label="关联游戏" optional />
            <Select value={gameId} options={gameOptions} onChange={(event) => { setGameId(event.target.value); setBoardId('') }} />
          </div>

          <div className="max-w-xl">
            <FieldHeading label="添加话题" />
            <p className="mt-1 text-sm text-text-secondary">选择或创建与发布内容相关的话题，最多5个。</p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                value={topicQuery}
                onChange={(event) => setTopicQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTopic(topicQuery)
                  }
                }}
                placeholder="搜索或输入新话题"
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
              />
              {topicQuery.trim() && topics && topics.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border bg-white p-1 shadow-lg">
                  {topics.slice(0, 6).map((topic) => (
                    <button key={topic.id} type="button" onClick={() => addTopic(topic.name)} className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-muted hover:text-text">
                      #{topic.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topicNames.map((topic) => (
                <button key={topic} type="button" onClick={() => setTopicNames((current) => current.filter((item) => item !== topic))} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20">
                  #{topic} ×
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-md">
            <div className="flex items-center justify-between">
              <FieldHeading label="加入合集" optional />
              <button type="button" onClick={handleCreateCollection} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover">
                <Plus className="h-4 w-4" />新建合集
              </button>
            </div>
            <Select value={collectionId} options={collectionOptions} onChange={(event) => setCollectionId(event.target.value)} />
          </div>

          <DeclarationToggle label="原创内容" description="声明该内容为本人原创" checked={isOriginal} onChange={setIsOriginal} />
          <DeclarationToggle label="AI生成内容" description="声明该内容含有AI生成部分" checked={containsAiGenerated} onChange={setContainsAiGenerated} icon={<Sparkles className="h-4 w-4" />} />

          {!managedPostId && <section className="max-w-xl rounded-lg border border-border bg-white p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={scheduleEnabled} onChange={(event) => setScheduleEnabled(event.target.checked)} className="h-4 w-4 accent-primary" />
              <span className="font-bold text-text">定时发布</span>
            </label>
            {scheduleEnabled && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Clock3 className="h-4 w-4 text-primary" />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={minScheduleAt}
                  max={maxScheduleAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="rounded-md border border-border px-3 py-2 text-sm text-text outline-none focus:border-primary"
                />
                <span className="text-xs text-text-secondary">可选时间：当前后2小时至15天</span>
              </div>
            )}
          </section>}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-text-secondary">{managedPostId ? '修改后自动公开，已封禁帖子仍需管理员解封。' : '发布后自动公开展示。'}</p>
          <div className="flex gap-3">
            {!managedPostId && <Button type="button" variant="outline" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              保存草稿
            </Button>}
            <Button type="button" onClick={handlePublish} loading={managedPostId ? managedUpdateMutation.isPending : publishMutation.isPending}>
              {managedPostId ? '提交修改' : scheduleEnabled ? '保存定时发布' : '发布'}
            </Button>
          </div>
        </footer>
      </main>
    </div>
  )
}

function FieldHeading({ label, optional = false }: { label: string; optional?: boolean }) {
  return (
    <h2 className="text-lg font-black text-text">
      {label}
      {optional && <span className="ml-2 text-xs font-medium text-text-secondary">可选</span>}
    </h2>
  )
}

function DeclarationToggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-text-secondary">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />
      <span className="inline-flex items-center gap-1 font-bold text-text">{icon}{label}</span>
      <span>{description}</span>
    </label>
  )
}
