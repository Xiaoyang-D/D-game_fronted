import { lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useParams, useSearchParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { ToastProvider } from '@/components/ui/Toast'
import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/store/authStore'
import { HomePage } from '@/pages/home/HomePage'
import { AssistantProvider } from '@/components/assistant/AssistantProvider'
import { MessageProvider } from '@/components/messages/MessageProvider'

// Keep the home page in the entry chunk; load other pages only when visited.
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const EmailAuthForm = lazy(() => import('@/pages/auth/EmailAuthForm').then(m => ({ default: m.EmailAuthForm })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage').then(m => ({ default: m.CommunityPage })))
const SearchResultsPage = lazy(() => import('@/pages/search/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })))
const PostDetailPage = lazy(() => import('@/pages/community/PostDetailPage').then(m => ({ default: m.PostDetailPage })))
const CreatePostPage = lazy(() => import('@/pages/community/CreatePostPage').then(m => ({ default: m.CreatePostPage })))
const PostManagementPage = lazy(() => import('@/pages/community/PostManagementPage').then(m => ({ default: m.PostManagementPage })))
const FollowingPage = lazy(() => import('@/pages/community/FollowingPage').then(m => ({ default: m.FollowingPage })))
const UserProfilePage = lazy(() => import('@/pages/users/UserProfilePage').then(m => ({ default: m.UserProfilePage })))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage').then(m => ({ default: m.AdminHomePage })))
const GameSectionsPage = lazy(() => import('@/pages/admin/GameSectionsPage').then(m => ({ default: m.GameSectionsPage })))
const AdminCreateGamePage = lazy(() => import('@/pages/admin/AdminCreateGamePage').then(m => ({ default: m.AdminCreateGamePage })))
const AdminAuditPostPage = lazy(() => import('@/pages/admin/AdminAuditPostPage').then(m => ({ default: m.AdminAuditPostPage })))
const AdminBannedPostsPage = lazy(() => import('@/pages/admin/AdminBannedPostsPage').then(m => ({ default: m.AdminBannedPostsPage })))
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage').then(m => ({ default: m.AdminModerationPage })))
const AdminModerationRulesPage = lazy(() => import('@/pages/admin/AdminModerationRulesPage').then(m => ({ default: m.AdminModerationRulesPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })))
const AssistantPage = lazy(() => import('@/pages/assistant/AssistantPage').then(m => ({ default: m.AssistantPage })))

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
              <MessageProvider>
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
                  <Route path="comments" element={<Navigate to="/admin/moderation?targetType=COMMENT" replace />} />
                  <Route path="moderation" element={<AdminModerationPage />} />
                  <Route path="moderation/rules" element={<AdminModerationRulesPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                </Route>
              </Route>
              </Routes>
              </MessageProvider>
            </AppInitializer>
          </AssistantProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
