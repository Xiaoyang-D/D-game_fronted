import api from './client'
import type { Id, PageResult, PostCollectionResp, UpdateProfileReq, UserFavoriteResp, UserProfileResp, UserResp } from '@/types/api'

export async function getCurrentUser(): Promise<UserResp> {
  return api.get<UserResp>('/users/me')
}

export async function updateProfile(data: UpdateProfileReq): Promise<UserResp> {
  return api.put<UserResp>('/users/me', data)
}

export async function getUserProfile(id: Id): Promise<UserProfileResp> {
  return api.get<UserProfileResp>(`/users/${id}/profile`)
}

export async function getUserFavorites(
  id: Id,
  params?: { page?: number; size?: number },
): Promise<PageResult<UserFavoriteResp>> {
  return api.get<PageResult<UserFavoriteResp>>(`/users/${id}/favorites`, { params })
}

export async function getMyCollections(): Promise<PostCollectionResp[]> {
  return api.get<PostCollectionResp[]>('/users/me/collections')
}

export async function createMyCollection(name: string): Promise<PostCollectionResp> {
  return api.post<PostCollectionResp>('/users/me/collections', { name })
}
