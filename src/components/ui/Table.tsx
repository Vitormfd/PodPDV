import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Table({ className, children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-[13px]', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
      <tr>{children}</tr>
    </thead>
  )
}

export function Th({ className, align = 'left', children, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={cn(
        'px-5 py-2.5 text-[11.5px] font-semibold text-slate-500 dark:text-ink-400',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-ink-800/70">{children}</tbody>
}

export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/40', className)} {...props}>
      {children}
    </tr>
  )
}

export function Td({ className, align = 'left', children, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'px-5 py-3 text-slate-700 dark:text-ink-200',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}
