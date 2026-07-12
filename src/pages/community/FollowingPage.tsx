import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFollowingPosts } from '@/api/post'
import { PostCard } from '@/components/community/PostCard'
import { Empty } from '@/components/ui/Empty'
import { Loading } from '@/components/ui/Loading'
import { Pagination } from '@/components/ui/Pagination'

export function FollowingPage() {
  const [page, setPage] = useState(1)
  const size = 10
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'following', page, size],
    queryFn: () => getFollowingPosts({ page, size }),
  })

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-0">
      <h1 className="text-2xl font-bold text-text">关注动态</h1>
      <p className="mt-1 text-sm text-text-secondary">只显示你关注用户已通过审核的帖子</p>
      <div className="mt-6">
        {isLoading ? <Loading /> : data?.records.length ? <>
          <div className="space-y-4">{data.records.map((post) => <PostCard key={post.id} post={post} />)}</div><Pagination page={page} size={size} total={data.total} onChange={setPage} /></> :
          <Empty title="关注动态为空" description="关注其他用户后，他们的新帖子会显示在这里。" />}
      </div>
    </div>
  )
}
