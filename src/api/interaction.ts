import api from './client'
import type { Id, InteractionReq } from '@/types/api'

export async function like(data: InteractionReq): Promise<void> {
  await api.post<void>('/likes', data)
}

export async function unlike(data: InteractionReq): Promise<void> {
  await api.delete<void>('/likes', { data })
}

export async function favorite(data: InteractionReq): Promise<void> {
  await api.post<void>('/favorites', data)
}

export async function unfavorite(data: InteractionReq): Promise<void> {
  await api.delete<void>('/favorites', { data })
}

export async function follow(followeeId: Id): Promise<void> {
  await api.post<void>(`/follows/${followeeId}`)
}

export async function unfollow(followeeId: Id): Promise<void> {
  await api.delete<void>(`/follows/${followeeId}`)
}
