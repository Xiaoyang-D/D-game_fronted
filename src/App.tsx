import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useParams, useSearchParams } from 'react-router-dom'
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
import { EmailAuthForm } from '@/pages/auth/EmailAuthForm'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CommunityPage } from '@/pages/community/CommunityPage'
import { SearchResultsPage } from '@/pages/search/SearchResultsPage'
import { PostDetailPage } from '@/pages/community/PostDetailPage'
import { CreatePostPage } from '@/pages/community/CreatePostPage'
import { PostManagementPage } from '@/pages/community/PostManagementPage'
import { FollowingPage } from '@/pages/community/FollowingPage'
import { UserProfilePage } from '@/pages/users/UserProfilePage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { GameSectionsPage } from '@/pages/admin/GameSectionsPage'
import { AdminCreateGamePage } from '@/pages/admin/AdminCreateGamePage'
import { AdminAuditPostPage } from '@/pages/admin/AdminAuditPostPage'
import { AdminBannedPostsPage } from '@/pages/admin/AdminBannedPostsPage'
import { AdminAuditCommentPage } from '@/pages/admin/AdminAuditCommentPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AssistantProvider } from '@/components/assistant/AssistantProvider'
import { AssistantPage } from '@/pages/assistant/AssistantPage'

function CommunityRoute() {
  const [params] = useSearchParams()
  return params.get('gameId') ? <CommunityPage /> : <Navigate to="/" replace />
}

function LegacyGameRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? `/community?gameId=${encodeURIComponent(id)}` : '/community'} replace />
}

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
          <AssistantProvider>
            <AppInitializer>
              <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<EmailAuthForm mode="reset" />} />
                <Route path="account-migration" element={<EmailAuthForm mode="migration" />} />
                <Route path="games" element={<Navigate to="/community" replace />} />
                <Route path="games/:id" element={<LegacyGameRedirect />} />
                <Route path="community" element={<CommunityRoute />} />
                <Route path="search" element={<SearchResultsPage />} />
                <Route path="assistant" element={<AssistantPage />} />
                <Route path="posts/:id" element={<PostDetailPage />} />
                <Route path="users/:id" element={<UserProfilePage />} />
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
                  path="posts/manage"
                  element={
                    <ProtectedRoute>
                      <PostManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="posts/drafts" element={<Navigate to="/posts/manage?tab=draft" replace />} />
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
                  <Route path="game-sections" element={<GameSectionsPage />} />
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
          </AssistantProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
