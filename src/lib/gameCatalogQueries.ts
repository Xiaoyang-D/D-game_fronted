import { queryOptions } from '@tanstack/react-query'
import { getGames } from '@/api/game'

export const GAME_CATALOG_STALE_TIME = 5 * 60 * 1000

/** Same pagination shares a cache; differently sized catalogs remain separate. */
export function gameCatalogOptions(page = 1, size = 100) {
  return queryOptions({
    queryKey: ['games', 'catalog', { page, size }],
    queryFn: () => getGames({ page, size }),
    staleTime: GAME_CATALOG_STALE_TIME,
  })
}
