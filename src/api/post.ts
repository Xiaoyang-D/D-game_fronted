import api from './client'
import type { Board, CreatePostReq, Id, PageResult, PostResp, PostsQuery } from '@/types/api'

export async function getBoards(): Promise<Board[]> {
  return api.get<Board[]>('/boards')
}

export async function getPosts(params: PostsQuery): Promise<PageResult<PostResp>> {
  return api.get<PageResult<PostResp>>('/posts', { params })
}

export async function getFollowingPosts(params: Pick<PostsQuery, 'page' | 'size'>): Promise<PageResult<PostResp>> {
  return api.get<PageResult<PostResp>>('/posts/following', { params })
}

export async function getPost(id: Id): Promise<PostResp> {
  return api.get<PostResp>(`/posts/${id}`)
}

export async function createPost(data: CreatePostReq): Promise<Id> {
  return api.post<Id>('/posts', data)
}
