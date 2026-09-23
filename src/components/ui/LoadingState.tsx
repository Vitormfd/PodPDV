import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export function LoadingState({ label = 'Carregando...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
      <p className="text-[13px] text-slate-500 dark:text-ink-400">{label}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-100 dark:bg-ink-800', className)} />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-ink-800/70">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
