import { describe, expect, it } from 'vitest'
import { canApproveModeration, managedPostCandidate, moderationSnapshotText, parseModerationCandidate, postSubmissionMessage } from './moderation'
import type { ModerationView, PostManageItem } from '@/types/api'

const post: PostManageItem = {
  id: '9007199254740993999', boardId: '2', boardName: '讨论', gameId: null, gameName: null,
  collectionId: null, collectionName: null, title: '公开标题', content: '<p>公开正文</p>', status: 2,
  isOriginal: false, containsAiGenerated: false, topics: [], viewCount: 1, likeCount: 0,
  commentCount: 0, favoriteCount: 0, scheduledPublishAt: null, gmtCreate: '', gmtModified: '',
}
const review: ModerationView = {
  submissionId: '19', targetType: 'POST', targetId: post.id, status: 'PENDING', reason: null,
  candidateJson: JSON.stringify({ title: '修改待审标题', content: '<p>新正文</p>', boardId: '9007199254740993998', topicNames: ['攻略'], status: 3 }),
  matchedWords: ['规则词'], ruleVersion: 1, manual: 0, reviewedAt: null,
}

describe('moderated post candidates', () => {
  it('disables approval while a fresh content check is unavailable, without changing editability', () => {
    expect(canApproveModeration({ status: 'PENDING', checkUnavailable: true })).toBe(false)
    expect(canApproveModeration({ status: 'PENDING', checkUnavailable: false })).toBe(true)
    expect(canApproveModeration({ status: 'PENDING' })).toBe(true)
    expect(canApproveModeration({ status: 'REJECTED' })).toBe(false)
    expect(canApproveModeration(null)).toBe(false)
  })
  it('loads the latest pending content without mutating the public snapshot or numeric status', () => {
    const original = { ...post, moderation: review, hasPublishedVersion: true }
    const candidate = managedPostCandidate(original)
    expect(candidate.title).toBe('修改待审标题')
    expect(candidate.boardId).toBe('9007199254740993998')
    expect(candidate.topics[0].name).toBe('攻略')
    expect(candidate.status).toBe(2)
    expect(original.title).toBe('公开标题')
  })

  it('allows rejected candidates to be edited but never clears an administrative ban', () => {
    const candidate = managedPostCandidate({ ...post, status: 4, moderation: { ...review, status: 'REJECTED' } })
    expect(candidate.title).toBe('修改待审标题')
    expect(candidate.status).toBe(4)
  })

  it('does not let an old approved revision override current public content', () => {
    expect(managedPostCandidate({ ...post, moderation: { ...review, status: 'APPROVED' } }).title).toBe('公开标题')
  })

  it('retains explicit removal of optional metadata in a pending revision', () => {
    const candidate = managedPostCandidate({ ...post, gameId: '4', collectionId: '5', scheduledPublishAt: '2026-10-18T15:00:00', moderation: { ...review, candidateJson: '{"gameId":null,"collectionId":null,"scheduledPublishAt":null}' } })
    expect(candidate.gameId).toBeNull()
    expect(candidate.collectionId).toBeNull()
    expect(candidate.scheduledPublishAt).toBeNull()
  })

  it.each(['broken-json', 'null', '[]', '"text"'])('handles an unavailable snapshot: %s', value => {
    expect(parseModerationCandidate(value)).toEqual({})
  })

  it('explains pending scheduled publication and the second rule check', () => {
    expect(postSubmissionMessage(review, true)).toContain('延后发布')
    expect(postSubmissionMessage({ ...review, status: 'APPROVED' }, true)).toContain('再次检查')
    expect(postSubmissionMessage(review)).toContain('审核')
  })

  it('extracts text for review without retaining image tags and keeps plain comment angle brackets', () => {
    const html = JSON.stringify({ title: '待审', content: '<p>文本 &amp; 示例</p><img src="https://example.com/a" onerror="alert(1)"><p>&lt;文字&gt; &#128512;</p>' })
    expect(moderationSnapshotText(html, 'POST')).toEqual({ title: '待审', body: '文本 & 示例\n<文字> 😀' })
    expect(moderationSnapshotText(JSON.stringify({ content: '保留 <游戏名>' }), 'COMMENT').body).toBe('保留 <游戏名>')
  })
})
