import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isAdmin: store.isAdmin(),
    logout: store.logout,
    fetchUser: store.fetchUser,
    setUser: store.setUser,
  }
}
