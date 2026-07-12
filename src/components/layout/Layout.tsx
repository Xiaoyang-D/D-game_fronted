import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function Layout() {
  return (
    <div className="dg-pattern flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-12 pt-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
