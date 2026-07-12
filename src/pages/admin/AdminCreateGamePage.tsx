import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getCategories, getTags, createGame } from '@/api/game'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  name: z.string().min(1, '请输入游戏名称'),
  categoryId: z.string().min(1, '请选择分类'),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  developer: z.string().optional(),
  releaseDate: z.string().optional(),
  tagIds: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AdminCreateGamePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const tagIds = data.tagIds
        ? data.tagIds.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

      const gameId = await createGame({
        name: data.name,
        categoryId: data.categoryId,
        coverUrl: data.coverUrl || undefined,
        description: data.description || undefined,
        developer: data.developer || undefined,
        releaseDate: data.releaseDate || undefined,
        tagIds,
      })
      toast(`游戏创建成功，ID: ${gameId}`)
      reset()
    } catch (err) {
      toast(err instanceof Error ? err.message : '创建失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (catLoading) return <Loading />

  const categoryOptions = [
    { value: '', label: '请选择分类' },
    ...(categories?.map((c) => ({ value: String(c.id), label: c.name })) || []),
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">创建游戏</h1>
      <p className="mt-1 text-sm text-text-secondary">添加新游戏到游戏库</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="游戏名称" error={errors.name?.message} {...register('name')} />
          <Select label="分类" options={categoryOptions} error={errors.categoryId?.message} {...register('categoryId')} />
          <Input label="封面 URL" error={errors.coverUrl?.message} {...register('coverUrl')} />
          <Textarea label="简介" error={errors.description?.message} {...register('description')} />
          <Input label="开发商" error={errors.developer?.message} {...register('developer')} />
          <Input label="发行日期" type="date" error={errors.releaseDate?.message} {...register('releaseDate')} />
          <Input
            label="标签 ID（逗号分隔）"
            placeholder={tags?.map((t) => `${t.id}=${t.name}`).join(', ')}
            error={errors.tagIds?.message}
            {...register('tagIds')}
          />
          <Button type="submit" loading={loading}>创建游戏</Button>
        </form>
      </Card>
    </div>
  )
}
