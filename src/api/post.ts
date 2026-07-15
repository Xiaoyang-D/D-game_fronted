import api from './client'
import type {
  Board,
  CreatePostReq,
  Id,
  PageResult,
  PostDraftResp,
  PostDraftSaveReq,
  PostManageItem,
  PostManagePageResp,
  PostManageTab,
  PostPublishReq,
  PostResp,
  PostTopicResp,
  PostsQuery,
} from '@/types/api'

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

export async function publishPost(data: PostPublishReq): Promise<Id> {
  return api.post<Id>('/posts/publish', data)
}

export async function getDrafts(params?: { page?: number; size?: number }): Promise<PageResult<PostDraftResp>> {
  return api.get<PageResult<PostDraftResp>>('/posts/drafts', { params })
}

export async function getDraft(id: Id): Promise<PostDraftResp> {
  return api.get<PostDraftResp>(`/posts/drafts/${id}`)
}

export async function saveDraft(data: PostDraftSaveReq): Promise<PostDraftResp> {
  return api.post<PostDraftResp>('/posts/drafts', data)
}

export async function updateDraft(id: Id, data: PostDraftSaveReq): Promise<PostDraftResp> {
  return api.put<PostDraftResp>(`/posts/drafts/${id}`, data)
}

export async function deleteDraft(id: Id): Promise<void> {
  await api.delete<void>(`/posts/drafts/${id}`)
}

export async function publishDraft(id: Id, data: PostPublishReq): Promise<Id> {
  return api.post<Id>(`/posts/drafts/${id}/publish`, data)
}

export async function getPostTopics(keyword?: string): Promise<PostTopicResp[]> {
  return api.get<PostTopicResp[]>('/posts/topics', { params: keyword ? { keyword } : undefined })
}

const manageStatusByTab: Record<PostManageTab, string> = {
  published: 'APPROVED',
  pending: 'PENDING',
  rejected: 'REJECTED',
  draft: 'DRAFT',
}

/** Fetch one management tab while keeping the four-tab counters in the response. */
export async function getPostManagement(params: { tab: PostManageTab; page?: number; size?: number }): Promise<PostManagePageResp> {
  return api.get<PostManagePageResp>('/posts/manage', {
    params: { ...params, status: manageStatusByTab[params.tab] },
  })
}

/** Load an author-owned post for the management editor. */
export async function getManagedPost(id: Id): Promise<PostManageItem> {
  return api.get<PostManageItem>(`/posts/manage/${id}`)
}

/** Submit a management edit; submitted posts become pending again on the server. */
export async function updateManagedPost(id: Id, data: PostPublishReq): Promise<PostManageItem> {
  return api.put<PostManageItem>(`/posts/manage/${id}`, data)
}

/** Delete an author-owned post from any management tab. */
export async function deleteManagedPost(id: Id): Promise<void> {
  await api.delete<void>(`/posts/manage/${id}`)
}
