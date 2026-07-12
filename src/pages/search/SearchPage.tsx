import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Gamepad2, Search as SearchIcon } from 'lucide-react'
import { search } from '@/api/search'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PostCard } from '@/components/community/PostCard'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { formatRating } from '@/lib/utils'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q')?.trim() || ''
  const [input, setInput] = useState(keyword)
  const [type, setType] = useState<'ALL' | 'GAME' | 'POST'>('ALL')
  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword, type],
    queryFn: () => search({ keyword, type, page: 1, size: 10 }),
    enabled: Boolean(keyword),
  })

  const submit = () => {
    const value = input.trim()
    setSearchParams(value ? { q: value } : {})
  }

  const hasResults = (data?.games?.records.length ?? 0) + (data?.posts?.records.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text">全站搜索</h1>
      <div className="mt-6 flex gap-2">
        <Input
          value={input}
          placeholder="搜索游戏或社区帖子"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
        />
        <Button onClick={submit}>
          <SearchIcon className="h-4 w-4" />
          搜索
        </Button>
      </div>
      <div className="mt-4 flex gap-2">
        {(['ALL', 'GAME', 'POST'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`rounded-full px-3 py-1 text-sm cursor-pointer ${
              type === item ? 'bg-primary text-white' : 'border border-border text-text-secondary'
            }`}
          >
            {{ ALL: '全部', GAME: '游戏', POST: '帖子' }[item]}
          </button>
        ))}
      </div>
      {!keyword ? (
        <Empty title="输入关键词开始搜索" />
      ) : isLoading ? (
        <div className="mt-8"><Loading /></div>
      ) : hasResults ? (
        <div className="mt-8 space-y-8">
          {data?.games?.records.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text">游戏</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.games.records.map((game) => (
                  <Link key={game.id} to={`/games/${game.id}`}>
                    <Card hover>
                      <div className="flex gap-3">
                        <Gamepad2 className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium text-text">{game.name}</h3>
                          <p className="text-sm text-text-secondary">{game.categoryName} · {formatRating(game.avgRating)} 分</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {data?.posts?.records.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text">帖子</h2>
              <div className="space-y-4">
                {data.posts.records.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-8"><Empty title="没有找到相关内容" /></div>
      )}
    </div>
  )
}
