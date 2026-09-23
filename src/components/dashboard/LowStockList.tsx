import { Badge } from '@/components/ui/Badge'

interface LowStockItem {
  id: string
  name: string
  stock_quantity: number
  min_stock: number
}

export function LowStockList({ items }: { items: LowStockItem[] }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-ink-800/70">
      {items.map((item) => {
        const critical = item.stock_quantity <= 0
        return (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <p className="truncate text-[13px] font-medium text-slate-800 dark:text-ink-100">{item.name}</p>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[12px] tabular-nums text-slate-400 dark:text-ink-500">mín. {item.min_stock}</span>
              <Badge tone={critical ? 'danger' : 'warning'} dot>
                {item.stock_quantity} un.
              </Badge>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
