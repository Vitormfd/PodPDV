import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NAV_ITEMS, NAV_GROUPS } from './navItems'
import { cn } from '@/lib/cn'

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const primaryItems = NAV_ITEMS.filter((i) => i.mobilePrimary)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium',
                isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-ink-400'
              )
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium text-slate-500 dark:text-ink-400"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
          Mais
        </button>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 rounded-t-xl border-t border-slate-200 bg-white p-4 pb-8 shadow-2xl dark:border-ink-700 dark:bg-ink-900">
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-slate-300 dark:bg-ink-700" />
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <p className="mb-2 px-1 text-[11px] font-medium text-slate-400 dark:text-ink-500">{group.label}</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-col items-center gap-2 rounded-lg border px-3 py-3.5 text-[11.5px] font-medium',
                          isActive
                            ? 'border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-800 dark:bg-accent-950/60 dark:text-accent-300'
                            : 'border-slate-200 text-slate-600 dark:border-ink-800 dark:text-ink-300'
                        )
                      }
                    >
                      <item.icon className="h-4.5 w-4.5" strokeWidth={2} />
                      <span className="text-center leading-tight">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
