import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-[19px] font-semibold text-slate-900 dark:text-ink-50">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
