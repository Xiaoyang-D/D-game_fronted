import api from './client'
import type {
  AssignRoleReq,
  AuditReq,
  BannedAuthorPostsQuery,
  BatchAuditReq,
  Id,
  PageResult,
  PostResp,
  ReportAuditReq,
  ReportResp,
  SysRole,
} from '@/types/api'

export function getPendingReports(params: { page: number; size: number }): Promise<PageResult<ReportResp>> {
  return api.get<PageResult<ReportResp>>('/admin/reports/pending', { params })
}

export function auditReport(id: Id, data: ReportAuditReq): Promise<void> {
  return api.put<void>(`/admin/reports/${id}`, data)
}

export async function banUser(userId: Id): Promise<void> {
  await api.put<void>(`/admin/users/${userId}/ban`)
}

export async function unbanUser(userId: Id): Promise<void> {
  await api.put<void>(`/admin/users/${userId}/unban`)
}

export async function getPendingPosts(params?: { page?: number; size?: number }): Promise<PageResult<PostResp>> {
  return api.get<PageResult<PostResp>>('/admin/posts/pending', { params })
}

export async function auditPost(postId: Id, data: AuditReq): Promise<void> {
  await api.post<void>(`/admin/posts/${postId}/audit`, data)
}

export async function batchAuditPosts(data: BatchAuditReq): Promise<void> {
  await api.post<void>('/admin/posts/batch-audit', data)
}

export async function getBannedAuthorPosts(params?: BannedAuthorPostsQuery): Promise<PageResult<PostResp>> {
  return api.get<PageResult<PostResp>>('/admin/posts/banned-authors', { params })
}

export async function deletePost(postId: Id): Promise<void> {
  await api.delete<void>(`/admin/posts/${postId}`)
}

export async function auditComment(commentId: Id, data: AuditReq): Promise<void> {
  await api.post<void>(`/admin/comments/${commentId}/audit`, data)
}

export async function getRoles(): Promise<SysRole[]> {
  return api.get<SysRole[]>('/admin/roles')
}

export async function assignRole(data: AssignRoleReq): Promise<void> {
  await api.post<void>('/admin/roles/assign', data)
}
