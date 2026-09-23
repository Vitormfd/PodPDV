import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white dark:border-ink-800 dark:bg-ink-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3.5 dark:border-ink-800', className)}>
      <div>
        <h3 className="text-[13px] font-semibold tracking-wide text-slate-800 dark:text-ink-100">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}
