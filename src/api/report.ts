import api from './client'
import type { Id } from '@/types/api'

export function createReport(data: { targetType: number; targetId: Id; reason: string }): Promise<void> {
  return api.post<null>('/reports', data).then(() => undefined)
}
