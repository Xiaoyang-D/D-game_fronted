import { describe, expect, it } from 'vitest'
import type { CommentResp } from '../types/api'
import { buildCommentThreads } from './commentThreads'

function comment(id: string, parentId = '0', name = id): CommentResp {
  return {
    id, parentId, postId: 'post', userId: id, userNickname: name,
    userAvatarUrl: null, content: `评论 ${id}`, likeCount: 0, gmtCreate: '2026-10-09T17:00:00',
  }
}

describe('buildCommentThreads', () => {
  it('keeps all users replies, including replies to replies', () => {
    const threads = buildCommentThreads([
      comment('1', '0', '楼主'), comment('2', '1', '甲'), comment('3', '2', '乙'),
      comment('4', '3', '丙'), comment('5', '1', '丁'),
    ])
    expect(threads).toHaveLength(1)
    expect(threads[0].replies.map((item) => item.comment.id)).toEqual(['2', '3', '4', '5'])
    expect(threads[0].replies.map((item) => item.replyToName)).toEqual(['楼主', '甲', '乙', '楼主'])
  })

  it('finds ancestors even when newest sorting puts replies before parents', () => {
    const threads = buildCommentThreads([comment('3', '2'), comment('2', '1'), comment('1')])
    expect(threads[0].root.comment.id).toBe('1')
    expect(threads[0].replies.map((item) => item.comment.id)).toEqual(['3', '2'])
  })

  it('shows replies whose parent is on another page or no longer visible', () => {
    const threads = buildCommentThreads([comment('2', '1'), comment('3', '2')])
    expect(threads[0].root.comment.id).toBe('2')
    expect(threads[0].root.replyToName).toBe('其他评论')
    expect(threads[0].replies[0].comment.id).toBe('3')
  })

  it('preserves distinct snowflake IDs and root ordering', () => {
    const first = '2062801749048246274'
    const second = '2062801749048246275'
    const threads = buildCommentThreads([comment(second), comment('reply', first), comment(first)])
    expect(threads.map((thread) => thread.root.comment.id)).toEqual([second, first])
    expect(threads[1].replies[0].comment.id).toBe('reply')
  })

  it('handles invalid cycles without hiding or duplicating comments', () => {
    const threads = buildCommentThreads([comment('1', '2'), comment('2', '1'), comment('3', '3')])
    const displayed = threads.flatMap((thread) =>
      [thread.root.comment.id, ...thread.replies.map((item) => item.comment.id)],
    )
    expect(displayed.sort()).toEqual(['1', '2', '3'])
  })

  it('returns no threads for an empty page', () => {
    expect(buildCommentThreads([])).toEqual([])
  })
})
