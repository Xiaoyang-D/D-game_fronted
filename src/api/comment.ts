import api from './client'
import type { CommentResp, CommentsQuery, CreateCommentReq, Id, PageResult } from '@/types/api'

export async function getComments(params: CommentsQuery): Promise<PageResult<CommentResp>> {
  return api.get<PageResult<CommentResp>>('/comments', { params })
}

export async function createComment(data: CreateCommentReq): Promise<Id> {
  return api.post<Id>('/comments', data)
}

export async function deleteComment(commentId: Id): Promise<void> {
  await api.delete<void>(`/comments/${commentId}`)
}

export const getMyModeratedComments = (params: { postId: Id; page: number; size: number }) =>
  api.get<PageResult<CommentResp>>('/comments/mine', { params })

export const updateModeratedComment = (commentId: Id, data: Pick<CreateCommentReq, 'content' | 'mentions'>) =>
  api.put<Id>(`/comments/${commentId}`, data)

export const getCommentLocation = (commentId: Id) => api.get<{ postId: Id; commentId: Id; page: number }>(`/comments/${commentId}/location`, { params: { sort: 'DEFAULT', size: 20 } })
