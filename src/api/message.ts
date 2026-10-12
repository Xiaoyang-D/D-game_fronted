import api from './client'
import type { Id, PageResult } from '@/types/api'
import type { ChatMessage, Conversation, MessageHistory, UnreadSummary, UserBrief } from '@/types/messages'
export const getFriends = (page = 1, q = '') => api.get<PageResult<UserBrief>>('/users/me/friends', { params: { page, size: 20, q } })
export const openConversation = (friendId: Id) => api.post<Conversation>('/conversations', { friendId })
export const getConversations = (page = 1) => api.get<PageResult<Conversation>>('/conversations', { params: { page, size: 20 } })
export const getConversation = (id: Id) => api.get<Conversation>(`/conversations/${id}`)
export const getMessageHistory = (id: Id, beforeSeq?: string) => api.get<MessageHistory>(`/conversations/${id}/messages`, { params: { beforeSeq, size: 50 } })
/** 重试必须复用原 clientMessageId；调用方禁止把正文或访问令牌写入诊断日志。 */
export const sendMessage = (id: Id, content: string, clientMessageId: string) => api.post<ChatMessage>(`/conversations/${id}/messages`, { content, clientMessageId })
export const recallMessage = (id: Id) => api.put<void>(`/messages/${id}/recall`)
/** 仅隐藏当前用户已有历史，对方记录和之后的新消息不受影响。 */
export const deleteConversation = (id: Id) => api.delete<void>(`/conversations/${id}`)
/** 只提交本人已实际展示的序号，不提供对方已读回执。 */
export const readConversation = (id: Id, lastVisibleSeq: string) => api.put<void>(`/conversations/${id}/read`, { lastVisibleSeq })
export const getUnreadSummary = () => api.get<UnreadSummary>('/messages/unread-summary')
export const searchMentionUsers = (q: string) => api.get<UserBrief[]>('/users/mention-candidates', { params: { q } })
