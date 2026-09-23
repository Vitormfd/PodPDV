import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-400',
  info: 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300',
}

const DOT_CLASSES: Record<Tone, string> = {
  neutral: 'bg-slate-400 dark:bg-ink-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-accent-500',
}

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className,
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium leading-5',
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASSES[tone])} />}
      {children}
    </span>
  )
}
