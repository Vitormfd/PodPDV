import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 disabled:hover:bg-accent-600 dark:bg-accent-500 dark:hover:bg-accent-400 dark:active:bg-accent-600 dark:text-ink-950',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-ink-700 dark:bg-transparent dark:text-ink-200 dark:hover:border-ink-500 dark:hover:bg-ink-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50',
  danger:
    'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 dark:bg-danger-500 dark:hover:bg-danger-400',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9.5 w-9.5 shrink-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'focus-ring inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
