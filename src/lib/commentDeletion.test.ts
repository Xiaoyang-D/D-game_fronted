import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { canDeleteComment, getCommentDeletionMessage, getCommentPageAfterDeletion, isReplyTargetDeleted, refreshCommentDeletionQueries } from './commentDeletion'
import { buildCommentThreads } from './commentThreads'
import type { CommentResp } from '@/types/api'

describe('comment deletion', () => {
  const comment = (id: string, parentId: string): CommentResp => ({
    id, parentId, postId: 'post', userId: id, userNickname: id,
    userAvatarUrl: null, content: id, likeCount: 0, gmtCreate: '',
  })

  it('warns about removing the whole floor only for top-level comments', () => {
    expect(getCommentDeletionMessage(comment('root', '0'))).toBe('确定删除这层评论吗？该层的所有回复也会删除。')
    expect(getCommentDeletionMessage(comment('reply', 'root'))).toBe('确定删除这条回复吗？后续回复将保留。')
  })

  it('clears the removed reply target and descendants of a removed floor only', () => {
    const root = comment('root', '0')
    const reply = comment('reply', 'root')
    const deeper = comment('deeper', 'reply')
    const unrelated = comment('unrelated', 'other-root')
    const records = [root, reply, deeper, unrelated]
    expect(isReplyTargetDeleted(null, root, records)).toBe(false)
    expect(isReplyTargetDeleted(root, root, records)).toBe(true)
    expect(isReplyTargetDeleted(reply, root, records)).toBe(true)
    expect(isReplyTargetDeleted(deeper, root, records)).toBe(true)
    expect(isReplyTargetDeleted(unrelated, root, records)).toBe(false)
    expect(isReplyTargetDeleted(reply, reply, records)).toBe(true)
    expect(isReplyTargetDeleted(deeper, reply, records)).toBe(false)
    expect(isReplyTargetDeleted(comment('cycle', 'cycle'), root, records)).toBe(false)
  })
  it('allows the comment author, post author and administrator only', () => {
    expect(canDeleteComment('comment-author', 'comment-author', 'post-author', false)).toBe(true)
    expect(canDeleteComment('post-author', 'comment-author', 'post-author', false)).toBe(true)
    expect(canDeleteComment('admin', 'comment-author', 'post-author', true)).toBe(true)
    expect(canDeleteComment('other', 'comment-author', 'post-author', false)).toBe(false)
    expect(canDeleteComment(undefined, 'comment-author', 'post-author', true)).toBe(false)
    expect(canDeleteComment('2062801749048246274', '2062801749048246275', 'post-author', false)).toBe(false)
  })

  it('retains valid pages and returns to the last valid page when totals shrink', () => {
    expect(getCommentPageAfterDeletion(3, 40, 20)).toBe(2)
    expect(getCommentPageAfterDeletion(3, 20, 20)).toBe(1)
    expect(getCommentPageAfterDeletion(2, 21, 20)).toBe(2)
    expect(getCommentPageAfterDeletion(1, 0, 20)).toBe(1)
  })

  it('keeps reparented replies and deeper descendants visible', () => {
    const promoted = buildCommentThreads([comment('child', '0'), comment('grandchild', 'child'), comment('sibling', '0')])
    expect(promoted.map(thread => thread.root.comment.id)).toEqual(['child', 'sibling'])
    expect(promoted[0].replies[0].comment.id).toBe('grandchild')
    const nested = buildCommentThreads([comment('root', '0'), comment('child', 'root'), comment('grandchild', 'child')])
    expect(nested[0].replies.map(item => item.comment.id)).toEqual(['child', 'grandchild'])
  })

  it('awaits refreshing displayed comments and counts and invalidates all cached comment pages', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
    let total = 21
    const key = ['comments', 'post', 2, 'DEFAULT']
    const comments = new QueryObserver(client, { queryKey: key, queryFn: async () => ({ total, records: total === 21 ? ['deleted'] : [] }) })
    const post = new QueryObserver(client, { queryKey: ['post', 'post'], queryFn: async () => ({ commentCount: total }) })
    const unsubscribeComments = comments.subscribe(() => {})
    const unsubscribePost = post.subscribe(() => {})
    const affectedKeys = [['comments', 'post', 1, 'LATEST'], ['posts', 'home'], ['post-management', 'published', 1]]
    try {
      await Promise.all([comments.refetch(), post.refetch()])
      for (const cachedKey of [...affectedKeys, ['comments', 'other'], ['post', 'other']]) client.setQueryData(cachedKey, {})
      total = 20
      await refreshCommentDeletionQueries(client, 'post')
      expect(comments.getCurrentResult().data).toEqual({ total: 20, records: [] })
      expect(post.getCurrentResult().data?.commentCount).toBe(20)
      for (const cachedKey of affectedKeys) expect(client.getQueryState(cachedKey)?.isInvalidated).toBe(true)
      expect(client.getQueryState(['comments', 'other'])?.isInvalidated).toBe(false)
      expect(client.getQueryState(['post', 'other'])?.isInvalidated).toBe(false)
    } finally {
      unsubscribeComments()
      unsubscribePost()
      client.clear()
    }
  })
})
