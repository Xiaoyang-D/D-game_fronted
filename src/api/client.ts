import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { Result } from '@/types/api'
import { API_BASE_URL } from '@/lib/constants'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }
type TokenPayload = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'd_game_access_token'
const REFRESH_TOKEN_KEY = 'd_game_refresh_token'
const CACHED_USER_KEY = 'd_game_user'

let isRefreshing = false
let refreshQueue: Array<() => void> = []

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

function errorFromResult(result: Result<unknown>): Error {
  return new Error(result.message || '请求失败')
}

export function setAuthTokens(tokens: TokenPayload): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(CACHED_USER_KEY)
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken()
  const response = await axios.post<Result<TokenPayload>>(`${API_BASE_URL}/auth/refresh`, refreshToken ? { refreshToken } : undefined, {
    withCredentials: true,
  })
  if (response.data.code !== 0) throw errorFromResult(response.data)
  setAuthTokens(response.data.data)
}

function redirectToLogin(): void {
  clearAuthTokens()
  if (window.location.pathname !== '/login') window.location.href = '/login'
}

axiosInstance.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  async (response) => {
    const result = response.data as Result<unknown>
    if (result.code === 0) return result.data as never

    const originalRequest = response.config as RetriableConfig
    const isAuthFailure = result.code === 401 || result.code === 1005 || result.code === 1006
    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    if (!isAuthFailure || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(errorFromResult(result))
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(axiosInstance(originalRequest)))
      })
    }

    originalRequest._retry = true
    isRefreshing = true
    try {
      await refreshAccessToken()
      refreshQueue.forEach((retry) => retry())
      refreshQueue = []
      return axiosInstance(originalRequest)
    } catch (error) {
      refreshQueue = []
      redirectToLogin()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
  (error: AxiosError<Result<unknown>>) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  },
)

const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.get(url, config) as Promise<T>
  },
  post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.post(url, data, config) as Promise<T>
  },
  put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.put(url, data, config) as Promise<T>
  },
  delete<T, D = unknown>(url: string, config?: AxiosRequestConfig & { data?: D }): Promise<T> {
    return axiosInstance.delete(url, config) as Promise<T>
  },
}

export default api
