import api from './client'
import type {
  CreateGameReq,
  GameCategory,
  GameReviewResp,
  GameResp,
  GamesQuery,
  Id,
  PageResult,
  RatingReq,
  Tag,
} from '@/types/api'

export async function getGames(params: GamesQuery): Promise<PageResult<GameResp>> {
  return api.get<PageResult<GameResp>>('/games', { params })
}

export async function getGame(id: Id): Promise<GameResp> {
  return api.get<GameResp>(`/games/${id}`)
}

export async function getGameReviews(id: Id, params?: { page?: number; size?: number }): Promise<PageResult<GameReviewResp>> {
  return api.get<PageResult<GameReviewResp>>(`/games/${id}/reviews`, { params })
}

export async function getCategories(): Promise<GameCategory[]> {
  return api.get<GameCategory[]>('/games/categories')
}

export async function getTags(): Promise<Tag[]> {
  return api.get<Tag[]>('/games/tags')
}

export async function rateGame(id: Id, data: RatingReq): Promise<null> {
  return api.post<null>(`/games/${id}/rating`, data)
}

export async function createGame(data: CreateGameReq): Promise<Id> {
  return api.post<Id>('/games', data)
}
