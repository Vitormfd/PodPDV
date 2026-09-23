import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'default' | 'success' | 'warning' | 'danger'

const TONE_ICON_CLASSES: Record<Tone, string> = {
  default: 'bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-950 dark:text-danger-400',
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
  loading?: boolean
}

export function StatCard({ label, value, icon: Icon, tone = 'default', hint, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4.5 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-500 dark:text-ink-400">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', TONE_ICON_CLASSES[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-28 animate-pulse rounded-md bg-slate-100 dark:bg-ink-800" />
      ) : (
        <p className="font-display mt-1.5 text-[26px] font-semibold leading-tight tabular-nums text-slate-900 dark:text-ink-50">
          {value}
        </p>
      )}
      {hint && <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">{hint}</p>}
    </div>
  )
}
