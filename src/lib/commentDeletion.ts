import type { QueryClient } from '@tanstack/react-query'
import { TARGET_TYPE } from '@/lib/constants'
import { refreshInteractionQueries } from '@/lib/interactionQueries'
import type { CommentResp, Id } from '@/types/api'

export function canDeleteComment(userId: Id | undefined, commentAuthorId: Id, postAuthorId: Id, isAdmin: boolean) {
  return !!userId && (userId === commentAuthorId || userId === postAuthorId || isAdmin)
}

export function getCommentDeletionMessage(comment: CommentResp) {
  return comment.parentId === '0'
    ? '确定删除这层评论吗？该层的所有回复也会删除。'
    : '确定删除这条回复吗？后续回复将保留。'
}

/** 从已经加载的各页评论追溯回复对象，避免删除整层后继续回复已删除内容。 */
export function isReplyTargetDeleted(reply: CommentResp | null, removed: CommentResp, records: CommentResp[]) {
  if (!reply) return false
  if (reply.id === removed.id) return true
  if (removed.parentId !== '0') return false
  const comments = new Map(records.map(comment => [comment.id, comment]))
  const visited = new Set<Id>()
  let current: CommentResp | undefined = reply
  while (current && !visited.has(current.id)) {
    if (current.parentId === removed.id) return true
    visited.add(current.id)
    current = comments.get(current.parentId)
  }
  return false
}

/** 删除后保留当前页；只有超出新的总页数时才回退。 */
export function getCommentPageAfterDeletion(page: number, total: number, size: number) {
  return Math.min(page, Math.max(1, Math.ceil(total / size)))
}

export async function refreshCommentDeletionQueries(client: QueryClient, postId: Id) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['comments', postId] }),
    refreshInteractionQueries(client, TARGET_TYPE.POST, postId),
  ])
}
