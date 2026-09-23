import { formatCurrency } from '@/lib/formatters'
import type { DailyRevenuePoint } from '@/hooks/useDashboard'

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function formatDayLabel(iso: string, showWeekday: boolean): string {
  const date = new Date(`${iso}T00:00:00`)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return showWeekday ? `${WEEKDAY_SHORT[date.getDay()]} ${day}` : `${day}/${month}`
}

export function SalesTrendChart({ points }: { points: DailyRevenuePoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.total))
  const total = points.reduce((sum, p) => sum + p.total, 0)
  const showWeekday = points.length <= 8
  const showEveryLabel = points.length <= 10

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-[13px] text-slate-400 dark:text-ink-500">
        Nenhuma venda registrada no período.
      </div>
    )
  }

  return (
    <div>
      <div className="flex h-36 items-end gap-1.5 sm:gap-2">
        {points.map((point, i) => {
          const heightPct = Math.max(3, Math.round((point.total / max) * 100))
          const isPeak = point.total === max && max > 0
          return (
            <div key={point.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
              <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-md bg-ink-950 px-2 py-1 text-[11px] font-medium text-ink-50 shadow-lg group-hover:block dark:bg-ink-800">
                {formatCurrency(point.total)}
              </div>
              <div
                className={`w-full rounded-[3px] transition-colors ${isPeak ? 'bg-accent-500' : 'bg-accent-200 group-hover:bg-accent-400 dark:bg-accent-900 dark:group-hover:bg-accent-600'}`}
                style={{ height: `${heightPct}%` }}
              />
              {(showEveryLabel || i === 0 || i === points.length - 1) && (
                <span className="text-[10px] leading-none text-slate-400 dark:text-ink-500">
                  {formatDayLabel(point.date, showWeekday)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
