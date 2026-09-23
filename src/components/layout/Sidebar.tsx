import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from './navItems'
import { BrandMark } from './BrandMark'
import { useCashRegister } from '@/contexts/CashRegisterContext'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/cn'

export function Sidebar() {
  const { register } = useCashRegister()
  const { profile } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-ink-800 dark:bg-ink-900 md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4.5 dark:border-ink-800">
        <BrandMark className="h-8 w-8" />
        <div className="leading-tight">
          <p className="font-display text-[14.5px] font-semibold text-slate-900 dark:text-ink-50">Vape PDV</p>
          <p className="text-[10.5px] text-slate-400 dark:text-ink-500">Controle de loja</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-ink-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-md py-2 pl-3 pr-3 text-[13.5px] font-medium transition-colors',
                      isActive
                        ? 'bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-500 transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2.5 border-t border-slate-200 px-3.5 py-3.5 dark:border-ink-800">
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 dark:bg-ink-950/60">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', register ? 'bg-success-500' : 'bg-ink-500')} />
          <span className="text-[12px] font-medium text-slate-600 dark:text-ink-300">
            {register ? 'Caixa aberto' : 'Caixa fechado'}
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[12px] font-semibold text-accent-700 dark:bg-accent-900 dark:text-accent-300">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-slate-800 dark:text-ink-100">
              {profile?.full_name ?? 'Usuário'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-ink-500">{profile ? ROLE_LABELS[profile.role] : ''}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
