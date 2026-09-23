import { formatCurrency } from '@/lib/formatters'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/constants'

export function PaymentBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
    .map(([method, total]) => ({ method: method as PaymentMethod, total }))
    .sort((a, b) => b.total - a.total)

  const max = Math.max(1, ...entries.map((e) => e.total))

  if (entries.length === 0) {
    return <p className="py-6 text-center text-[13px] text-slate-400 dark:text-ink-500">Nenhuma venda no período.</p>
  }

  return (
    <div className="space-y-3.5">
      {entries.map((entry) => (
        <div key={entry.method}>
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-slate-700 dark:text-ink-200">{PAYMENT_METHOD_LABELS[entry.method]}</span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-ink-50">{formatCurrency(entry.total)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
            <div
              className="h-full rounded-full bg-accent-500"
              style={{ width: `${Math.max(4, Math.round((entry.total / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
