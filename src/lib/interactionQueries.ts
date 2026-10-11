import type { QueryClient } from '@tanstack/react-query'
import { TARGET_TYPE } from '@/lib/constants'
import type { Id } from '@/types/api'

/** 刷新数据库中的互动计数，同时使列表中的旧计数失效。 */
export async function refreshInteractionQueries(client: QueryClient, targetType: number, targetId: Id) {
  const keys = targetType === TARGET_TYPE.POST
    ? [
      ['post', targetId], ['posts'], ['post-management'], ['search-results'],
      ['user-profile-posts'], ['user-profile-favorites'], ['user-profile'],
    ]
    : targetType === TARGET_TYPE.COMMENT
      ? [['comments']]
      : [['game', targetId], ['games']]
  await Promise.all(keys.map(queryKey => client.invalidateQueries({ queryKey })))
}
