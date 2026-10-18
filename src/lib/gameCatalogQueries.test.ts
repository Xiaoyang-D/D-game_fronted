import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGames } from '@/api/game'
import { GAME_CATALOG_STALE_TIME, gameCatalogOptions } from './gameCatalogQueries'

vi.mock('@/api/game', () => ({ getGames: vi.fn() }))
const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
const result = { records: [], page: 1, size: 100, total: 0 }
afterEach(() => { client.clear(); vi.clearAllMocks() })

describe('game catalog caching', () => {
  it('shares identical parameters across callers and keeps different page sizes separate', async () => {
    vi.mocked(getGames).mockResolvedValue(result)
    await Promise.all([client.fetchQuery(gameCatalogOptions()), client.fetchQuery(gameCatalogOptions())])
    await client.fetchQuery(gameCatalogOptions())
    expect(getGames).toHaveBeenCalledTimes(1)
    await client.fetchQuery(gameCatalogOptions(1, 6))
    await client.fetchQuery(gameCatalogOptions(1, 12))
    expect(getGames).toHaveBeenCalledTimes(3)
    expect(gameCatalogOptions().staleTime).toBe(GAME_CATALOG_STALE_TIME)
  })

  it('refreshes active catalogs after admin invalidation even inside the freshness window', async () => {
    vi.mocked(getGames).mockResolvedValue(result)
    const observer = new QueryObserver(client, gameCatalogOptions(1, 12))
    const unsubscribe = observer.subscribe(() => {})
    try {
      await observer.refetch()
      await client.fetchQuery(gameCatalogOptions())
      vi.mocked(getGames).mockClear()
      await client.invalidateQueries({ queryKey: ['games'] })
      expect(getGames).toHaveBeenCalledTimes(1)
      expect(getGames).toHaveBeenCalledWith({ page: 1, size: 12 })
      expect(client.getQueryState(gameCatalogOptions().queryKey)?.isInvalidated).toBe(true)
      await client.fetchQuery(gameCatalogOptions())
      expect(getGames).toHaveBeenCalledTimes(2)
    } finally { unsubscribe() }
  })
})
