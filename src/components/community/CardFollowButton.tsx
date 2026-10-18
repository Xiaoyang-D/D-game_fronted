import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { follow, getFollowStatus, unfollow } from '@/api/interaction'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import type { Id } from '@/types/api'

export function CardFollowButton({ authorId, authorStatus, initialFollowing, followingUserId }: {
  authorId: Id
  authorStatus?: number
  initialFollowing?: boolean | null
  followingUserId?: Id | null
}) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isSelf = user?.id === authorId
  const unavailable = authorStatus === 0 && !user?.roles.includes('ADMIN')
  const queryKey = ['follow-status', authorId, user?.id]
  const { data: isFollowing, isPending, isError } = useQuery({
    queryKey,
    queryFn: () => getFollowStatus(authorId),
    enabled: isAuthenticated && !isSelf && !unavailable,
    initialData: followingUserId === user?.id && typeof initialFollowing === 'boolean' ? initialFollowing : undefined,
  })
  const mutation = useMutation({
    mutationFn: async () => {
      if (isFollowing === undefined) throw new Error('关注状态暂不可用，请稍后重试')
      const nextFollowing = !isFollowing
      if (nextFollowing) await follow(authorId)
      else await unfollow(authorId)
      return nextFollowing
    },
    onSuccess: (isFollowing) => {
      queryClient.setQueryData(queryKey, isFollowing)
      void queryClient.invalidateQueries({ queryKey: ['user-profile', authorId] })
      void queryClient.invalidateQueries({ queryKey: ['posts', 'following'] })
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  if (isSelf) return null
  return (
    <button
      type="button"
      disabled={mutation.isPending || (isAuthenticated && (unavailable || isPending || isError))}
      aria-pressed={Boolean(isFollowing)}
      onClick={() => {
        if (!isAuthenticated) { navigate('/login'); return }
        mutation.mutate()
      }}
      className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-bold text-text transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isFollowing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {mutation.isPending ? '处理中' : isFollowing ? '已关注' : '关注'}
    </button>
  )
}
