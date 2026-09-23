import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar pathname={pathname} />
        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 pb-20 sm:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
