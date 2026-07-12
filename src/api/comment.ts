import api from './client'
import type { CommentResp, CommentsQuery, CreateCommentReq, Id, PageResult } from '@/types/api'

export async function getComments(params: CommentsQuery): Promise<PageResult<CommentResp>> {
  return api.get<PageResult<CommentResp>>('/comments', { params })
}

export async function createComment(data: CreateCommentReq): Promise<Id> {
  return api.post<Id>('/comments', data)
}
