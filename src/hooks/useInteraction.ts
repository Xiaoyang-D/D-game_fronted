import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { favorite, getInteractionStatus, like, unfavorite, unlike } from '@/api/interaction'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import type { Id } from '@/types/api'
import { refreshInteractionQueries } from '@/lib/interactionQueries'

export function useInteraction(targetType: number, targetId: Id) {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const likeLockRef = useRef(false)
  const favoriteLockRef = useRef(false)
  const scopeKeyRef = useRef('')
  const scopeVersionRef = useRef(0)

  const isValidTarget = targetId !== undefined && targetId !== null && String(targetId).trim() !== ''
  const scopeKey = `${isAuthenticated ? 'auth' : 'guest'}:${targetType}:${String(targetId ?? '')}`

  if (scopeKeyRef.current !== scopeKey) {
    scopeKeyRef.current = scopeKey
    scopeVersionRef.current += 1
    likeLockRef.current = false
    favoriteLockRef.current = false
  }

  useEffect(() => {
    let canceled = false
    const scopeVersion = scopeVersionRef.current

    setLiked(false)
    setFavorited(false)
    setLikeLoading(false)
    setFavoriteLoading(false)
    likeLockRef.current = false
    favoriteLockRef.current = false

    if (!isAuthenticated || !isValidTarget) {
      setStatusLoading(false)
      return () => {
        canceled = true
      }
    }

    setStatusLoading(true)
    getInteractionStatus({ targetType, targetId })
      .then((status) => {
        if (canceled || scopeVersion !== scopeVersionRef.current) return
        setLiked(status.liked)
        setFavorited(status.favorited)
      })
      .catch(() => {
        if (canceled || scopeVersion !== scopeVersionRef.current) return
        setLiked(false)
        setFavorited(false)
      })
      .finally(() => {
        if (!canceled && scopeVersion === scopeVersionRef.current) {
          setStatusLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [isAuthenticated, isValidTarget, targetId, targetType])

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast('请先登录', 'error')
      return false
    }
    return true
  }

  const toggleLike = async () => {
    if (!requireAuth() || !isValidTarget || statusLoading || likeLockRef.current) return

    const scopeVersion = scopeVersionRef.current
    likeLockRef.current = true
    setLikeLoading(true)

    try {
      if (liked) {
        await unlike({ targetType, targetId })
        if (scopeVersion !== scopeVersionRef.current) return
        setLiked(false)
        await refreshInteractionQueries(queryClient, targetType, targetId)
        if (scopeVersion !== scopeVersionRef.current) return
        toast('已取消点赞')
      } else {
        await like({ targetType, targetId })
        if (scopeVersion !== scopeVersionRef.current) return
        setLiked(true)
        await refreshInteractionQueries(queryClient, targetType, targetId)
        if (scopeVersion !== scopeVersionRef.current) return
        toast('点赞成功')
      }
    } catch (err) {
      if (scopeVersion !== scopeVersionRef.current) return
      const msg = err instanceof Error ? err.message : '操作失败'
      if (msg.includes('已点赞')) {
        setLiked(true)
        await refreshInteractionQueries(queryClient, targetType, targetId)
      } else if (msg.includes('未点赞')) {
        setLiked(false)
        await refreshInteractionQueries(queryClient, targetType, targetId)
      } else {
        toast(msg, 'error')
      }
    } finally {
      if (scopeVersion === scopeVersionRef.current) {
        likeLockRef.current = false
        setLikeLoading(false)
      }
    }
  }

  const toggleFavorite = async () => {
    if (!requireAuth() || !isValidTarget || statusLoading || favoriteLockRef.current) return

    const scopeVersion = scopeVersionRef.current
    favoriteLockRef.current = true
    setFavoriteLoading(true)

    try {
      if (favorited) {
        await unfavorite({ targetType, targetId })
        if (scopeVersion !== scopeVersionRef.current) return
        setFavorited(false)
        await refreshInteractionQueries(queryClient, targetType, targetId)
        if (scopeVersion !== scopeVersionRef.current) return
        toast('已取消收藏')
      } else {
        await favorite({ targetType, targetId })
        if (scopeVersion !== scopeVersionRef.current) return
        setFavorited(true)
        await refreshInteractionQueries(queryClient, targetType, targetId)
        if (scopeVersion !== scopeVersionRef.current) return
        toast('收藏成功')
      }
    } catch (err) {
      if (scopeVersion !== scopeVersionRef.current) return
      const msg = err instanceof Error ? err.message : '操作失败'
      if (msg.includes('已收藏')) {
        setFavorited(true)
        await refreshInteractionQueries(queryClient, targetType, targetId)
      } else if (msg.includes('未收藏')) {
        setFavorited(false)
        await refreshInteractionQueries(queryClient, targetType, targetId)
      } else {
        toast(msg, 'error')
      }
    } finally {
      if (scopeVersion === scopeVersionRef.current) {
        favoriteLockRef.current = false
        setFavoriteLoading(false)
      }
    }
  }

  const loading = statusLoading || likeLoading || favoriteLoading

  return {
    liked,
    favorited,
    loading,
    statusLoading,
    likeLoading,
    favoriteLoading,
    toggleLike,
    toggleFavorite,
  }
}
