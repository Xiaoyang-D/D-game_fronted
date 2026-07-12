import api from './client'
import type { SearchQuery, SearchResp } from '@/types/api'

export function search(query: SearchQuery): Promise<SearchResp> {
  return api.get<SearchResp>('/search', { params: query })
}
