import api from './client'
import { clearAuthTokens, setAuthTokens } from './client'
import type { LoginReq, RegisterReq, TokenResp } from '@/types/api'

export async function login(data: LoginReq): Promise<TokenResp> {
  const tokens = await api.post<TokenResp>('/auth/login', data)
  setAuthTokens(tokens)
  return tokens
}

export async function register(data: RegisterReq): Promise<TokenResp> {
  const tokens = await api.post<TokenResp>('/auth/register', data)
  setAuthTokens(tokens)
  return tokens
}

export async function logout(): Promise<void> {
  try {
    await api.post<null>('/auth/logout')
  } finally {
    clearAuthTokens()
  }
}
