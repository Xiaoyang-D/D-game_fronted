import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { PenSquare, Search } from 'lucide-react'
import { getBoards, getPosts } from '@/api/post'
import { Button } from '@/components/ui/Button'
import { PostCard } from '@/components/community/PostCard'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { useAuthStore } from '@/store/authStore'

export function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const boardId = searchParams.get('boardId') || undefined
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const size = 10
  const { isAuthenticated } = useAuthStore()

  const { data: boards } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['posts', { boardId, keyword: searchKeyword, page, size }],
    queryFn: () => getPosts({ boardId, keyword: searchKeyword || undefined, page, size }),
  })

  const handleBoardChange = (id?: string) => {
    if (id) {
      setSearchParams({ boardId: String(id) })
    } else {
      setSearchParams({})
    }
    setPage(1)
  }

  const handleSearch = () => {
    setSearchKeyword(keyword)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">社区</h1>
          <p className="mt-1 text-sm text-text-secondary">分享攻略、讨论心得。仅展示已通过审核的帖子</p>
        </div>
        {isAuthenticated && (
          <Link to="/posts/new">
            <Button>
              <PenSquare className="h-4 w-4" />
              发帖
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleBoardChange(undefined)}
          className={`rounded-full px-3 py-1 text-sm transition-colors duration-200 cursor-pointer ${
            !boardId ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
          }`}
        >
          全部板块
        </button>
        {boards?.map((board) => (
          <button
            key={board.id}
            onClick={() => handleBoardChange(board.id)}
            className={`rounded-full px-3 py-1 text-sm transition-colors duration-200 cursor-pointer ${
              boardId === board.id ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
            }`}
          >
            {board.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="搜索帖子标题..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
          搜索
        </Button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <Loading />
        ) : data && data.records.length > 0 ? (
          <>
            <div className="flex flex-col gap-4">
              {data.records.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination page={page} size={size} total={data.total} onChange={setPage} />
          </>
        ) : (
          <Empty title="暂无帖子" description="成为第一个发帖的人吧" />
        )}
      </div>
    </div>
  )
}
