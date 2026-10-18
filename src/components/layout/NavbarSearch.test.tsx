// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getGames } from '@/api/game'
import { gameCatalogOptions } from '@/lib/gameCatalogQueries'
import { NavbarSearch } from './NavbarSearch'

vi.mock('@/api/game', () => ({ getGames: vi.fn() }))
let client: QueryClient
let root: Root
let container: HTMLDivElement
function SearchHarness() {
  const navigate = useNavigate()
  return <><NavbarSearch /><button data-testid="navigate" onClick={() => navigate('/search?keyword=next&gameId=2')}>navigate</button></>
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.mocked(getGames).mockResolvedValue({ records: [], page: 1, size: 100, total: 0 })
  await client.fetchQuery(gameCatalogOptions())
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(() => root.unmount())
  client.clear()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

it('reopening the scope menu reuses the fresh catalog, including after URL navigation', async () => {
  await act(() => root.render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={['/search?keyword=old']}><SearchHarness /></MemoryRouter>
  </QueryClientProvider>))
  for (let index = 0; index < 4; index++) {
    await act(() => (container.querySelector('[aria-label="搜索版区：全部"]') as HTMLButtonElement).click())
  }
  expect(getGames).toHaveBeenCalledTimes(1)
  expect(container.querySelector('input')?.value).toBe('old')
  await act(() => (container.querySelector('[data-testid="navigate"]') as HTMLButtonElement).click())
  expect(container.querySelector('input')?.value).toBe('next')
  expect(container.querySelector('[aria-label="选择搜索版区"]')).toBeNull()
  expect(getGames).toHaveBeenCalledTimes(1)
})
