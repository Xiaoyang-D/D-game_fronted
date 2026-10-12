import type { Id } from './api'
export interface UserBrief { id: Id; nickname: string; avatarUrl: string | null }
export interface Conversation { id: Id; friendId: Id; nickname: string; avatarUrl: string | null; lastContent: string; lastTime: string; unreadCount: number; isFriend: boolean }
export interface ChatMessage { id: Id; conversationId: Id; senderId: Id; seq: string; content: string; recalled: boolean; gmtCreate: string; recallDeadline: string }
export interface MessageHistory { records: ChatMessage[]; hasMore: boolean }
export interface UnreadSummary { total: number; privateMessages: number; replies: number; mentions: number; likes: number; system: number; social: number }
export interface NotificationSettings { replies: boolean; mentions: boolean; likes: boolean; social: boolean }
export type NotificationCategory = 'reply' | 'mention' | 'like' | 'system' | 'social'
export interface Mention { userId: Id; start: number; end: number }
export interface MessageEvent { type: string; conversationId?: Id; actorId?: Id }
