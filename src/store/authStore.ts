import { create } from 'zustand'
import { getStoredAccessToken } from '@/api/client'
import { logout as logoutApi } from '@/api/auth'
import { getCurrentUser } from '@/api/user'
import type { UserResp } from '@/types/api'

const CACHED_USER_KEY = 'd_game_user'

interface AuthState {
  user: UserResp | null
  isAuthenticated: boolean
  isLoading: boolean
  initialized: boolean
  setUser: (user: UserResp | null) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CACHED_USER_KEY)
    }
    set({ user, isAuthenticated: !!user })
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const user = await getCurrentUser()
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      const currentUser = get().user
      set({ user: currentUser, isAuthenticated: !!currentUser, isLoading: false })
    }
  },

  logout: async () => {
    try {
      await logoutApi()
    } finally {
      localStorage.removeItem(CACHED_USER_KEY)
      set({ user: null, isAuthenticated: false })
    }
  },

  initialize: async () => {
    const cachedUser = readCachedUser() || readUserFromAccessToken()
    if (cachedUser) {
      set({ user: cachedUser, isAuthenticated: true })
    }
    await get().fetchUser()
    set({ initialized: true })
  },

  isAdmin: () => {
    const { user } = get()
    return !!user?.roles.includes('ADMIN')
  },
}))

function readCachedUser(): UserResp | null {
  const raw = localStorage.getItem(CACHED_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserResp
  } catch {
    localStorage.removeItem(CACHED_USER_KEY)
    return null
  }
}

function readUserFromAccessToken(): UserResp | null {
  const token = getStoredAccessToken()
  if (!token) return null
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1])) as {
      sub?: string
      username?: string
      roles?: string[]
    }
    if (!payload.sub || !payload.username) return null
    return {
      id: payload.sub,
      username: payload.username,
      nickname: payload.username,
      email: null,
      mobile: null,
      avatarUrl: null,
      bio: '',
      status: 1,
      roles: payload.roles || [],
      gmtCreate: '',
    }
  } catch {
    return null
  }
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  )
}
