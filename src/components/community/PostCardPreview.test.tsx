// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { PostResp } from '@/types/api'
import { PostCard } from './PostCard'

vi.mock('./CardFollowButton', () => ({ CardFollowButton: () => null }))

const post: PostResp = {
  id: '1', boardId: '2', boardName: '版区', gameId: null, gameName: null,
  userId: '3', authorNickname: '作者', title: '标题', content: '', status: 2,
  viewCount: 1, likeCount: 2, commentCount: 3, favoriteCount: 4, gmtCreate: '2026-10-18T12:00:00',
}

function render(value: PostResp, compact = false) {
  return new DOMParser().parseFromString(renderToStaticMarkup(
    <MemoryRouter><PostCard post={value} compact={compact} /></MemoryRouter>,
  ), 'text/html')
}

describe('bounded post list previews', () => {
  it('uses server excerpt and image metadata without needing full HTML', () => {
    const images = Array.from({ length: 8 }, (_, index) => ({
      originalUrl: `/image-${index}.jpg`, thumbnailUrl: `/image-${index}.thumb.jpg`, previewUrl: `/image-${index}.preview.jpg`,
    }))
    const document = render({ ...post, excerpt: '服务端摘要', images })
    expect(document.body.textContent).toContain('服务端摘要')
    expect(Array.from(document.querySelectorAll('img')).map(image => image.getAttribute('src')))
      .toEqual(['/image-0.thumb.jpg', '/image-1.thumb.jpg'])
    expect(render({ ...post, excerpt: '', images }, true).querySelectorAll('img')).toHaveLength(5)
  })

  it('continues to render a legacy API response with HTML only', () => {
    const document = render({ ...post, content: '<p>旧版摘要</p><img src="/legacy.jpg">' })
    expect(document.body.textContent).toContain('旧版摘要')
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/legacy.jpg')
  })

  it('renders excerpt as text and respects an intentionally empty excerpt', () => {
    const document = render({ ...post, excerpt: '<script>literal</script>' })
    expect(document.querySelector('script')).toBeNull()
    expect(document.body.textContent).toContain('<script>literal</script>')
    expect(render({ ...post, excerpt: '', content: '<p>不要回退正文</p>' }).body.textContent)
      .not.toContain('不要回退正文')
  })
})
