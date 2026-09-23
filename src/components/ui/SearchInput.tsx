import { Search, X } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange, className, placeholder = 'Buscar...', ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-ring h-9.5 w-full rounded-md border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-accent-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50 dark:placeholder:text-ink-500 dark:focus:border-accent-500"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-ink-500 dark:hover:text-ink-200"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
