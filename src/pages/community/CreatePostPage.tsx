import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getGames } from '@/api/game'
import { getBoards } from '@/api/post'
import { createPost } from '@/api/post'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  boardId: z.string().min(1, '请选择版块'),
  gameId: z.string().optional(),
  title: z.string().min(1, '请输入标题').max(200, '标题最长 200 字符'),
  content: z.string().min(1, '请输入正文'),
})

type FormData = z.infer<typeof schema>

export function CreatePostPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const initialGameId = searchParams.get('gameId') || ''

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const { data: games } = useQuery({
    queryKey: ['games', 'post-options'],
    queryFn: () => getGames({ page: 1, size: 100 }),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { boardId: '', gameId: initialGameId, title: '', content: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const postId = String(await createPost({
        boardId: data.boardId,
        gameId: data.gameId || undefined,
        title: data.title,
        content: data.content,
      }))
      toast('发帖成功，等待管理员审核')
      navigate(`/posts/${postId}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : '发帖失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <Loading />

  const boardOptions = [
    { value: '', label: '请选择版块' },
    ...(boards?.map((b) => ({ value: String(b.id), label: b.name })) || []),
  ]
  const gameOptions = [
    { value: '', label: '不关联游戏' },
    ...(games?.records.map((game) => ({ value: String(game.id), label: game.name })) || []),
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text">发表帖子</h1>
      <p className="mt-1 text-sm text-text-secondary">帖子提交后需等待管理员审核</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="版块"
            options={boardOptions}
            error={errors.boardId?.message}
            {...register('boardId')}
          />
          <Select
            label="关联游戏"
            options={gameOptions}
            error={errors.gameId?.message}
            {...register('gameId')}
          />
          <Input label="标题" error={errors.title?.message} {...register('title')} />
          <Textarea
            label="正文"
            rows={12}
            placeholder="支持 HTML 格式，如 <p>段落</p>"
            error={errors.content?.message}
            {...register('content')}
          />
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>发布</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>取消</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
