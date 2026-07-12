import { Navigate, useLocation } from 'react-router-dom'
import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
