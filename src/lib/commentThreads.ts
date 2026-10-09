import type { CommentResp, Id } from '@/types/api'

export interface CommentThreadItem {
  comment: CommentResp
  replyToName?: string
}

export interface CommentThread {
  root: CommentThreadItem
  replies: CommentThreadItem[]
}

/** 将当前页的任意层级回复归入可见祖先楼层，缺失父节点的回复独立展示。 */
export function buildCommentThreads(records: CommentResp[]): CommentThread[] {
  const comments = new Map(records.map((comment) => [comment.id, comment]))
  const rootIds = new Map<Id, Id>()
  const threads = new Map<Id, CommentThread>()

  function resolveRoot(id: Id): Id {
    const path: Id[] = []
    const positions = new Map<Id, number>()
    let currentId = id
    let rootId: Id

    while (true) {
      const cachedRoot = rootIds.get(currentId)
      if (cachedRoot !== undefined) {
        rootId = cachedRoot
        break
      }
      const cycleStart = positions.get(currentId)
      if (cycleStart !== undefined) {
        // 异常循环关系也必须展示，并保证每条评论只出现一次。
        rootId = path.slice(cycleStart).sort()[0]
        break
      }
      positions.set(currentId, path.length)
      path.push(currentId)
      const current = comments.get(currentId)!
      if (current.parentId === '0' || !comments.has(current.parentId)) {
        rootId = currentId
        break
      }
      currentId = current.parentId
    }

    for (const pathId of path) rootIds.set(pathId, rootId)
    return rootId
  }

  function item(comment: CommentResp): CommentThreadItem {
    return {
      comment,
      replyToName: comment.parentId === '0'
        ? undefined
        : comments.get(comment.parentId)?.userNickname || '其他评论',
    }
  }

  for (const comment of comments.values()) {
    const rootId = resolveRoot(comment.id)
    let thread = threads.get(rootId)
    if (!thread) {
      thread = { root: item(comments.get(rootId)!), replies: [] }
      threads.set(rootId, thread)
    }
    if (comment.id !== rootId) thread.replies.push(item(comment))
  }

  // 楼层按根评论在接口中的顺序排列，楼内回复保留接口的排序。
  const order = new Map(records.map((comment, index) => [comment.id, index]))
  return [...threads.values()].sort((left, right) =>
    order.get(left.root.comment.id)! - order.get(right.root.comment.id)!,
  )
}
