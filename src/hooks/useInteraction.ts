import { useState } from 'react'
import { favorite, like, unfavorite, unlike } from '@/api/interaction'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import type { Id } from '@/types/api'

export function useInteraction(targetType: number, targetId: Id) {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast('请先登录', 'error')
      return false
    }
    return true
  }

  const toggleLike = async () => {
    if (!requireAuth() || loading) return
    setLoading(true)
    try {
      if (liked) {
        await unlike({ targetType, targetId })
        setLiked(false)
        toast('已取消点赞')
      } else {
        await like({ targetType, targetId })
        setLiked(true)
        toast('点赞成功')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败'
      if (msg.includes('已点赞')) {
        setLiked(true)
      } else if (msg.includes('未点赞')) {
        setLiked(false)
      } else {
        toast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!requireAuth() || loading) return
    setLoading(true)
    try {
      if (favorited) {
        await unfavorite({ targetType, targetId })
        setFavorited(false)
        toast('已取消收藏')
      } else {
        await favorite({ targetType, targetId })
        setFavorited(true)
        toast('收藏成功')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败'
      if (msg.includes('已收藏')) {
        setFavorited(true)
      } else if (msg.includes('未收藏')) {
        setFavorited(false)
      } else {
        toast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return { liked, favorited, loading, toggleLike, toggleFavorite }
}
