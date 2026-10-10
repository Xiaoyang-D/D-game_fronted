import api from './client'
import { clearAuthTokens, setAuthTokens, getStoredRefreshToken } from './client'
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
    await api.post<null>('/auth/logout', { refreshToken: getStoredRefreshToken() })
  } finally {
    clearAuthTokens()
  }
}

export type EmailCodePurpose = 'REGISTER' | 'RESET_PASSWORD'
export function sendEmailCode(email: string, purpose: EmailCodePurpose): Promise<void> {
  return api.post('/auth/email/code', { email, purpose }, { timeout: 20000 })
}
export function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  return api.post('/auth/password/reset', { email, code, newPassword })
}
export function verifyMigration(username: string, password: string): Promise<{ migrationToken: string; expiresIn: number }> {
  return api.post('/auth/migration/verify', { username, password })
}
export function sendMigrationCode(migrationToken: string, email: string): Promise<void> {
  return api.post('/auth/migration/email/code', { migrationToken, email }, { timeout: 20000 })
}
export async function bindMigration(migrationToken: string, email: string, code: string): Promise<TokenResp> {
  const tokens = await api.post<TokenResp>('/auth/migration/bind', { migrationToken, email, code })
  setAuthTokens(tokens)
  return tokens
}
