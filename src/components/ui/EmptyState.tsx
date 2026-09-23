import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-ink-800">
        <Icon className="h-5 w-5 text-slate-400 dark:text-ink-400" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-slate-800 dark:text-ink-100">{title}</p>
        {description && <p className="max-w-xs text-[13px] text-slate-500 dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
