import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import { follow, unfollow } from '@/api/interaction'
import { getUserProfile } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import type { Id } from '@/types/api'

export function CardFollowButton({ authorId }: { authorId: Id }) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isSelf = user?.id === authorId
  const queryKey = ['user-profile', authorId, user?.id]
  const { data: profile, isPending, isError } = useQuery({
    queryKey,
    queryFn: () => getUserProfile(authorId),
    enabled: isAuthenticated && !isSelf,
  })
  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('作者资料暂不可用，请稍后重试')
      const nextFollowing = !profile.isFollowing
      if (nextFollowing) await follow(authorId)
      else await unfollow(authorId)
      return nextFollowing
    },
    onSuccess: (isFollowing) => {
      queryClient.setQueryData(queryKey, profile ? { ...profile, isFollowing } : undefined)
      void queryClient.invalidateQueries({ queryKey: ['user-profile', authorId] })
      void queryClient.invalidateQueries({ queryKey: ['posts', 'following'] })
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })
  if (isSelf) return null
  return (
    <button
      type="button"
      disabled={mutation.isPending || (isAuthenticated && (isPending || isError))}
      aria-pressed={Boolean(profile?.isFollowing)}
      onClick={() => {
        if (!isAuthenticated) { navigate('/login'); return }
        mutation.mutate()
      }}
      className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-bold text-text transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {profile?.isFollowing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {mutation.isPending ? '处理中' : profile?.isFollowing ? '已关注' : '关注'}
    </button>
  )
}
