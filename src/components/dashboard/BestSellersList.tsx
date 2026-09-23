import { formatCurrency } from '@/lib/formatters'
import type { BestSeller } from '@/types/domain'

export function BestSellersList({ items }: { items: BestSeller[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[13px] text-slate-400 dark:text-ink-500">Nenhuma venda no período.</p>
  }

  const max = Math.max(1, ...items.map((i) => i.quantity_sold))

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.product_id} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-[12px] font-medium tabular-nums text-slate-400 dark:text-ink-500">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[13px] font-medium text-slate-800 dark:text-ink-100">{item.product_name}</p>
              <p className="shrink-0 text-[12px] tabular-nums text-slate-400 dark:text-ink-500">
                {item.quantity_sold} un.
              </p>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
              <div
                className="h-full rounded-full bg-accent-400"
                style={{ width: `${Math.max(4, Math.round((item.quantity_sold / max) * 100))}%` }}
              />
            </div>
          </div>
          <span className="w-20 shrink-0 text-right text-[12.5px] tabular-nums font-semibold text-slate-700 dark:text-ink-200">
            {formatCurrency(item.revenue)}
          </span>
        </li>
      ))}
    </ul>
  )
}
