import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import type { UserResp } from '@/types/api'
import { CardFollowButton } from './CardFollowButton'

const clients: QueryClient[] = []
const authState = vi.hoisted(() => ({ user: null as UserResp | null, isAuthenticated: false }))

vi.mock('@/store/authStore', () => ({ useAuthStore: () => authState }))

afterEach(() => {
  clients.splice(0).forEach(client => client.clear())
  authState.user = null
  authState.isAuthenticated = false
})

function renderButton(viewerId: string, following: boolean, followingUserId = viewerId, authorStatus = 1) {
  authState.isAuthenticated = true
  authState.user = {
      id: viewerId, username: 'viewer', nickname: 'Viewer', email: null, mobile: null,
      avatarUrl: null, bio: '', status: 1, roles: ['USER'], gmtCreate: '',
  }
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } })
  clients.push(client)
  const markup = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          <CardFollowButton authorId="100" authorStatus={authorStatus}
            initialFollowing={following} followingUserId={followingUserId} />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { client, markup }
}

describe('follow status supplied by a post list', () => {
  it.each([false, true])('uses a known %s status without disabling the button', following => {
    const { client, markup } = renderButton('1', following)
    expect(client.getQueryData(['follow-status', '100', '1'])).toBe(following)
    expect(markup).toContain(`aria-pressed="${following}"`)
    expect(markup).not.toContain('disabled=')
  })

  it('does not seed another accounts cached relationship after switching users', () => {
    const { client, markup } = renderButton('2', true, '1')
    expect(client.getQueryData(['follow-status', '100', '2'])).toBeUndefined()
    expect(markup).toContain('disabled=')
    expect(markup).toContain('aria-pressed="false"')
  })

  it('keeps a banned authors action unavailable to ordinary users', () => {
    const { markup } = renderButton('1', false, '1', 0)
    expect(markup).toContain('disabled=')
  })
})
