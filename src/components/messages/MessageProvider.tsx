import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { getStoredAccessToken } from '@/api/client'
import { getCurrentUser } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL } from '@/lib/constants'
import type { MessageEvent } from '@/types/messages'

const ConnectionContext = createContext(false)
// eslint-disable-next-line react-refresh/only-export-components
export const useMessageConnection = () => useContext(ConnectionContext)

/** 只接收资源变化标识，再通过已鉴权接口刷新缓存；实时事件不携带消息正文。 */
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore(state => state.user?.id)
  const client = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const activeLocation = useRef(location)
  const [connected, setConnected] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)
  useEffect(() => { activeLocation.current = location }, [location])
  useEffect(() => {
    if (!userId) return
    let disposed = false
    let socket: WebSocket | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let heartbeat: ReturnType<typeof setInterval> | undefined
    let alertTimer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    let lastPong = Date.now()
    const refresh = () => {
      for (const key of ['conversations', 'chat-messages', 'message-summary', 'notifications', 'friends', 'user-profile', 'notification-settings']) void client.invalidateQueries({ queryKey: [key] })
    }
    const connect = async () => {
      try {
        // 连接前先确认登录状态，AUTH 帧使用当前访问令牌，令牌不进入 URL 或浏览器日志。
        await getCurrentUser()
        if (disposed) return
        const token = getStoredAccessToken()
        if (!token) return
        const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}/messages/ws`, window.location.origin)
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        socket = new WebSocket(url)
        socket.onopen = () => socket?.send(JSON.stringify({ type: 'AUTH', token }))
        socket.onmessage = (message) => {
          let event: MessageEvent
          try { event = JSON.parse(message.data) as MessageEvent } catch { return }
          if (event.type === 'READY') {
            // 重连后全量刷新授权数据，不能凭旧事件重建已经撤回或清除的正文。
            attempts = 0; lastPong = Date.now(); setConnected(true); refresh()
            heartbeat = setInterval(() => {
              if (Date.now() - lastPong > 65000) socket?.close()
              else if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'PING' }))
            }, 30000)
          } else if (event.type === 'PONG') lastPong = Date.now()
          else {
            refresh()
            const current = activeLocation.current
            if (event.type === 'CLEAR' && current.pathname === '/notifications' && new URLSearchParams(current.search).get('conversation') === event.conversationId) navigate('/notifications?tab=chats', { replace: true })
            if (event.type === 'MESSAGE' && event.actorId !== userId && event.conversationId
              && (document.visibilityState !== 'visible' || current.pathname !== '/notifications' || new URLSearchParams(current.search).get('conversation') !== event.conversationId)) {
              setAlert(event.conversationId); clearTimeout(alertTimer)
              alertTimer = setTimeout(() => setAlert(null), 5000)
            }
          }
        }
        socket.onclose = () => {
          // 断线指数退避，上限三十秒；connected=false 时页面查询自动启用轮询补偿。
          clearInterval(heartbeat); setConnected(false)
          if (!disposed) retryTimer = setTimeout(() => void connect(), Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)))
        }
        socket.onerror = () => socket?.close()
      } catch { if (!disposed) retryTimer = setTimeout(() => void connect(), 30000) }
    }
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    void connect()
    return () => {
      // 登出或切换账号时移除本人的消息缓存，避免下一位用户看到上一账号的历史。
      disposed = true; clearTimeout(retryTimer); clearTimeout(alertTimer); clearInterval(heartbeat)
      socket?.close(); setConnected(false); setAlert(null)
      window.removeEventListener('focus', onFocus)
      for (const key of ['conversations', 'chat-messages', 'message-summary', 'notifications', 'friends', 'notification-settings']) client.removeQueries({ queryKey: [key] })
    }
  }, [userId, client, navigate])
  return <ConnectionContext.Provider value={connected}>{children}{alert && <button type="button" onClick={() => { navigate(`/notifications?tab=chats&conversation=${alert}`); setAlert(null) }} className="fixed right-4 top-20 z-50 rounded-xl border border-primary/30 bg-white px-5 py-3 text-sm text-primary shadow-lg">收到一条好友消息，点击查看</button>}</ConnectionContext.Provider>
}
