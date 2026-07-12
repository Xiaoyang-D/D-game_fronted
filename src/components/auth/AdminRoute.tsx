import { Navigate } from 'react-router-dom'
import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/store/authStore'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized, isAdmin } = useAuthStore()

  if (!initialized) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
