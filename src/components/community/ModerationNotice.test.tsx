import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ModerationNotice } from './ModerationNotice'
import type { ModerationView } from '@/types/api'

const review: ModerationView = { submissionId: '1', targetType: 'BIO', targetId: '2', status: 'REJECTED', reason: '请移除广告内容', candidateJson: '{"bio":"新简介"}', matchedWords: ['广告词'], ruleVersion: 1, manual: 1, reviewedAt: '' }

describe('moderation feedback', () => {
  it('shows the reviewer reason and explains that the public version remains available', () => {
    const html = renderToStaticMarkup(<ModerationNotice moderation={review} hasPublishedVersion />)
    expect(html).toContain('请移除广告内容')
    expect(html).toContain('原版本仍公开')
    expect(html).toContain('未通过')
  })
  it('does not show a stale review warning after approval', () => {
    expect(renderToStaticMarkup(<ModerationNotice moderation={{ ...review, status: 'APPROVED' }} />)).toBe('')
  })
  it('does not promise early publication of scheduled pending content', () => {
    const html = renderToStaticMarkup(<ModerationNotice moderation={{ ...review, status: 'PENDING' }} scheduledPublishAt="2026-10-18T10:00:00" />)
    expect(html).toContain('最早按设定时间公开')
    expect(html).toContain('到期仍待审时延后发布')
  })
})
