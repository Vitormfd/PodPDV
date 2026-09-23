import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FieldWrapper({ label, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-slate-700 dark:text-ink-300">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs font-medium text-danger-600 dark:text-danger-400">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500 dark:text-ink-400">{hint}</p>}
    </div>
  )
}

const baseInputClasses =
  'focus-ring h-9.5 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-accent-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50 dark:placeholder:text-ink-500 dark:focus:border-accent-500 dark:disabled:bg-ink-900'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, wrapperClassName, className, ...props }, ref) => {
    const input = <input ref={ref} required={required} className={cn(baseInputClasses, error && 'border-danger-400 focus:border-danger-500', className)} {...props} />
    if (!label && !error && !hint) return input
    return (
      <div className={wrapperClassName}>
        <FieldWrapper label={label} error={error} hint={hint} required={required}>
          {input}
        </FieldWrapper>
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        required={required}
        className={cn(baseInputClasses, 'h-auto min-h-20 py-2', error && 'border-danger-400', className)}
        {...props}
      />
    )
    if (!label && !error && !hint) return textarea
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required}>
        {textarea}
      </FieldWrapper>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, children, ...props }, ref) => {
    const select = (
      <select ref={ref} required={required} className={cn(baseInputClasses, 'pr-8', error && 'border-danger-400', className)} {...props}>
        {children}
      </select>
    )
    if (!label && !error && !hint) return select
    return (
      <FieldWrapper label={label} error={error} hint={hint} required={required}>
        {select}
      </FieldWrapper>
    )
  }
)
Select.displayName = 'Select'
