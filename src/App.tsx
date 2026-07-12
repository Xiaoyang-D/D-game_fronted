import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { ToastProvider } from '@/components/ui/Toast'
import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/store/authStore'
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { GamesPage } from '@/pages/games/GamesPage'
import { GameDetailPage } from '@/pages/games/GameDetailPage'
import { CommunityPage } from '@/pages/community/CommunityPage'
import { PostDetailPage } from '@/pages/community/PostDetailPage'
import { CreatePostPage } from '@/pages/community/CreatePostPage'
import { FollowingPage } from '@/pages/community/FollowingPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminCreateGamePage } from '@/pages/admin/AdminCreateGamePage'
import { AdminAuditPostPage } from '@/pages/admin/AdminAuditPostPage'
import { AdminBannedPostsPage } from '@/pages/admin/AdminBannedPostsPage'
import { AdminAuditCommentPage } from '@/pages/admin/AdminAuditCommentPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { SearchPage } from '@/pages/search/SearchPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return <Loading text="初始化中..." />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="games/:id" element={<GameDetailPage />} />
                <Route path="community" element={<CommunityPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="posts/:id" element={<PostDetailPage />} />
                <Route path="following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
                <Route
                  path="posts/new"
                  element={
                    <ProtectedRoute>
                      <CreatePostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminHomePage />} />
                  <Route path="games/new" element={<AdminCreateGamePage />} />
                  <Route path="posts" element={<AdminAuditPostPage />} />
                  <Route path="posts/banned" element={<AdminBannedPostsPage />} />
                  <Route path="comments" element={<AdminAuditCommentPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                </Route>
              </Route>
            </Routes>
          </AppInitializer>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
