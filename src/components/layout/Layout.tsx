import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher'
import { Loading } from '@/components/ui/Loading'

export function Layout() {
  const location = useLocation()
  return (
    <div className={`flex min-h-screen flex-col ${(location.pathname === '/search' || /^\/posts\/[^/]+$/.test(location.pathname) && !['/posts/new', '/posts/manage', '/posts/drafts'].includes(location.pathname)) ? 'bg-[#f5f5f5]' : 'dg-pattern'}`}>
      <Navbar />
      <main className="flex-1 pb-12 pt-4">
        <Suspense fallback={<Loading text="页面加载中..." />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AssistantLauncher />
    </div>
  )
}
