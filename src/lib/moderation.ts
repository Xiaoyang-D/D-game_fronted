import type { ModerationStatus, ModerationTarget, ModerationView, PostManageItem, PostPublishReq } from '@/types/api'

export function parseModerationCandidate<T extends object>(value: string | null | undefined): Partial<T> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Partial<T> : {}
  } catch { return {} }
}

export function moderationStatusLabel(status: ModerationStatus): string {
  return { PENDING: '待审核', APPROVED: '已通过', REJECTED: '未通过', SUPERSEDED: '已被新提交替代', CANCELLED: '已取消' }[status]
}

/** Produce review text without mounting submitted HTML or loading embedded media. */
export function moderationSnapshotText(json: string | null, targetType: ModerationTarget): { title: string; body: string } {
  const snapshot = parseModerationCandidate<{ title: string; content: string; bio: string }>(json)
  const title = typeof snapshot.title === 'string' ? snapshot.title : ''
  const content = snapshot.bio ?? snapshot.content
  const body = typeof content === 'string' ? content : ''
  if (targetType !== 'POST') return { title, body }
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return { title, body: body.replace(/<\/(?:p|div|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match
    const codePoint = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
    return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match
  }).trim() }
}

export function isEditableModeration(view?: ModerationView | null): boolean {
  return view?.status === 'PENDING' || view?.status === 'REJECTED'
}

export function canApproveModeration(view?: { status: ModerationStatus; checkUnavailable?: boolean } | null): boolean {
  return view?.status === 'PENDING' && !view.checkUnavailable
}

export function managedPostCandidate(post: PostManageItem): PostManageItem {
  if (!isEditableModeration(post.moderation)) return post
  const candidate = parseModerationCandidate<PostPublishReq>(post.moderation?.candidateJson)
  return {
    ...post,
    boardId: candidate.boardId ?? post.boardId,
    gameId: candidate.gameId === undefined ? post.gameId : candidate.gameId ?? null,
    title: candidate.title ?? post.title,
    content: candidate.content ?? post.content,
    collectionId: candidate.collectionId === undefined ? post.collectionId : candidate.collectionId ?? null,
    isOriginal: candidate.isOriginal ?? post.isOriginal,
    containsAiGenerated: candidate.containsAiGenerated ?? post.containsAiGenerated,
    scheduledPublishAt: candidate.scheduledPublishAt === undefined ? post.scheduledPublishAt : candidate.scheduledPublishAt ?? null,
    topics: candidate.topicNames?.map(name => ({ id: name, name })) ?? post.topics,
  }
}

export function postSubmissionMessage(view?: ModerationView | null, scheduled = false): string {
  if (view?.status === 'PENDING') return scheduled ? '定时发布已保存，内容待审核；到期仍待审时将延后发布' : '已提交审核，通过后公开'
  if (view?.status === 'REJECTED') return '内容未通过审核，可修改后重新提交'
  return scheduled ? '定时发布已设置，到期后将再次检查内容' : '帖子已发布'
}
