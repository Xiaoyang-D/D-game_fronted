import api from './client'
import type { Id, ModerationDetail, ModerationRule, ModerationStatus, ModerationTarget, ModerationView, PageResult } from '@/types/api'

export const getLatestModeration = (targetType: ModerationTarget, targetId: Id) =>
  api.get<ModerationView | null>('/moderation/mine/latest', { params: { targetType, targetId } })

export const getModerationSubmissions = (params: { page: number; size: number; targetType?: ModerationTarget; status?: ModerationStatus }) =>
  api.get<PageResult<ModerationView>>('/admin/moderation/submissions', { params })

export const getModerationSubmission = (id: Id) => api.get<ModerationDetail>(`/admin/moderation/submissions/${id}`)

export const auditModeration = (id: Id, data: { approved: boolean; reason: string; ruleVersion: number | string }) =>
  api.post<void>(`/admin/moderation/submissions/${id}/audit`, data)

export const getModerationRules = (params: { page: number; size: number; category?: string; keyword?: string; enabled?: boolean }) =>
  api.get<PageResult<ModerationRule>>('/admin/moderation/rules', { params })

export type ModerationRuleInput = Pick<ModerationRule, 'word' | 'category' | 'enabled'>
export const createModerationRule = (data: ModerationRuleInput) => api.post<void>('/admin/moderation/rules', data)
export const updateModerationRule = (id: Id, data: ModerationRuleInput) => api.put<void>(`/admin/moderation/rules/${id}`, data)
export const deleteModerationRule = (id: Id) => api.delete<void>(`/admin/moderation/rules/${id}`)
export const importModerationRules = (data: { text: string; category: string }) =>
  api.post<{ imported: number; skipped: number }>('/admin/moderation/rules/import', data)
