import { useState } from 'react'
import { Moon, Sun, LogOut, ChevronDown, CircleDot } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCashRegister } from '@/contexts/CashRegisterContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { signOut } from '@/services/auth.service'
import { ROLE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/cn'

const PAGE_META: Record<string, { title: string; description?: string }> = {
  '/': { title: 'Dashboard', description: 'Visão geral do desempenho da loja' },
  '/pdv': { title: 'PDV' },
  '/produtos': { title: 'Produtos', description: 'Catálogo e controle de estoque' },
  '/estoque': { title: 'Movimentações de estoque' },
  '/clientes': { title: 'Clientes' },
  '/fiado': { title: 'Fiado', description: 'Contas a receber' },
  '/caixa': { title: 'Caixa' },
  '/relatorios': { title: 'Relatórios', description: 'Desempenho financeiro' },
}

export function Topbar({ pathname }: { pathname: string }) {
  const { profile } = useAuth()
  const { register } = useCashRegister()
  const { isDark, toggle } = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)

  const meta = PAGE_META[pathname] ?? { title: 'Vape PDV' }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-[15px] font-semibold text-slate-900 dark:text-ink-50">{meta.title}</h1>
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 dark:border-ink-700 sm:flex">
          <CircleDot className={cn('h-2.5 w-2.5', register ? 'text-success-500' : 'text-ink-500')} fill="currentColor" />
          <span className="text-[11.5px] font-medium text-slate-600 dark:text-ink-300">
            {register ? 'Caixa aberto' : 'Caixa fechado'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-ink-400 dark:hover:bg-ink-800"
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-ink-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-[11.5px] font-semibold text-accent-700 dark:bg-accent-900 dark:text-accent-300">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-[12.5px] font-semibold leading-tight text-slate-900 dark:text-ink-100">
                {profile?.full_name ?? 'Usuário'}
              </p>
              <p className="text-[11px] leading-tight text-slate-400 dark:text-ink-500">
                {profile ? ROLE_LABELS[profile.role] : ''}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-ink-500" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg shadow-black/5 dark:border-ink-700 dark:bg-ink-900 dark:shadow-black/30">
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
