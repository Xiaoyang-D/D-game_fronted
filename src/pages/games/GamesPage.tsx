import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Gamepad2, Search } from 'lucide-react'
import { getCategories, getGames, getTags } from '@/api/game'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/ui/Pagination'
import { formatRating } from '@/lib/utils'

export function GamesPage() {
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [tagId, setTagId] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const size = 12

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['games', { categoryId, tagId, keyword: searchKeyword, page, size }],
    queryFn: () => getGames({ categoryId, tagId, keyword: searchKeyword || undefined, page, size }),
  })

  const handleSearch = () => {
    setSearchKeyword(keyword)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text">游戏库</h1>
      <p className="mt-1 text-sm text-text-secondary">浏览和发现精彩游戏</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="搜索游戏名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
            搜索
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setCategoryId(undefined); setPage(1) }}
          className={`rounded-full px-3 py-1 text-sm transition-colors duration-200 cursor-pointer ${
            !categoryId ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
          }`}
        >
          全部分类
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategoryId(cat.id); setPage(1) }}
            className={`rounded-full px-3 py-1 text-sm transition-colors duration-200 cursor-pointer ${
              categoryId === cat.id ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setTagId(undefined); setPage(1) }}
            className={`rounded-full px-3 py-1 text-xs transition-colors duration-200 cursor-pointer ${
              !tagId ? 'bg-cta text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
            }`}
          >
            全部标签
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => { setTagId(tag.id); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs transition-colors duration-200 cursor-pointer ${
                tagId === tag.id ? 'bg-cta text-white' : 'bg-white border border-border text-text-secondary hover:bg-muted'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <Loading />
        ) : data && data.records.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.records.map((game) => (
                <Link key={game.id} to={`/games/${game.id}`}>
                  <Card hover className="h-full overflow-hidden p-0">
                    <div className="aspect-[4/3] bg-muted">
                      {game.coverUrl ? (
                        <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Gamepad2 className="h-12 w-12 text-border" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-text line-clamp-1">{game.name}</h3>
                      <p className="mt-1 text-xs text-text-secondary">{game.categoryName}</p>
                      {game.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {game.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs text-text-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm font-medium text-amber-600">
                        {formatRating(game.avgRating)} ({game.ratingCount})
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            <Pagination page={page} size={size} total={data.total} onChange={setPage} />
          </>
        ) : (
          <Empty title="没有找到游戏" description="尝试调整筛选条件" />
        )}
      </div>
    </div>
  )
}
