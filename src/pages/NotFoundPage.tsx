import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-ink-950">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-ink-800">
        <CompassIcon className="h-5 w-5 text-slate-400 dark:text-ink-400" />
      </div>
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-900 dark:text-ink-50">Página não encontrada</h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-ink-400">O endereço acessado não existe.</p>
      </div>
      <Link to="/">
        <Button variant="outline">Voltar ao início</Button>
      </Link>
    </div>
  )
}
