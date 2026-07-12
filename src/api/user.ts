import api from './client'
import type { UpdateProfileReq, UserResp } from '@/types/api'

export async function getCurrentUser(): Promise<UserResp> {
  return api.get<UserResp>('/users/me')
}

export async function updateProfile(data: UpdateProfileReq): Promise<UserResp> {
  return api.put<UserResp>('/users/me', data)
}
