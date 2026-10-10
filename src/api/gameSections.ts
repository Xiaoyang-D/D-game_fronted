import api from './client'
import type { Id, PageResult } from '@/types/api'

export interface GameSectionInput {
  name: string
  englishName: string
  description: string
  iconUrl: string
  bannerUrl: string
  sortOrder: number
  enabled: boolean
  categoryId?: Id
}
export interface GameSection extends GameSectionInput { id: Id }
export interface GameBoardInput {
  name: string
  description: string
  iconKey: 'forum' | 'official' | 'guide' | 'help' | 'art' | 'camera'
  iconUrl: string
  bannerUrl: string
  sortOrder: number
  enabled: boolean
  publishPolicy: 'LOGIN' | 'ADMIN'
}
export interface GameBoardSetting extends GameBoardInput { id: Id; gameId: Id; boardId: Id }
const root = '/admin/game-sections'
export const getGameSections = (page = 1) => api.get<PageResult<GameSection>>(root, { params: { page, size: 20 } })
export const saveGameSection = (data: GameSectionInput, id?: Id) => id ? api.put<void>(`${root}/${id}`, data) : api.post<Id>(root, data)
export const getGameSectionBoards = (id: Id) => api.get<GameBoardSetting[]>(`${root}/${id}/boards`)
export const saveGameSectionBoard = (gameId: Id, data: GameBoardInput, boardId?: Id) => boardId ? api.put<void>(`${root}/${gameId}/boards/${boardId}`, data) : api.post<Id>(`${root}/${gameId}/boards`, data)

export const getGameSection = (id: Id) => api.get<GameSection>(`${root}/${id}`)
