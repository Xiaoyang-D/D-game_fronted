import api from './client'
import type { Id, NotificationsQuery, PageResult, Notification } from '@/types/api'
import type { NotificationCategory, NotificationSettings } from '@/types/messages'

export async function getNotifications(params: NotificationsQuery): Promise<PageResult<Notification>> {
  return api.get<PageResult<Notification>>('/notifications', { params })
}

export async function getUnreadCount(): Promise<number> {
  return api.get<number>('/notifications/unread-count')
}

export async function markAsRead(id: Id): Promise<void> {
  await api.put<void>(`/notifications/${id}/read`)
}

export async function markAllAsRead(category?: NotificationCategory): Promise<void> {
  await api.put<void>('/notifications/read-all', undefined, { params: { category } })
}
export const getNotificationSettings = () => api.get<NotificationSettings>('/notifications/settings')
export const saveNotificationSettings = (settings: NotificationSettings) => api.put<void>('/notifications/settings', settings)
