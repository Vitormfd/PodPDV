import { useEffect, useState } from 'react'
import { getDashboardSummary, getBestSellers, getLowStockProducts } from '@/services/dashboard.service'
import { listSales } from '@/services/sales.service'
import type { BestSeller, DashboardSummary } from '@/types/domain'

export interface DailyRevenuePoint {
  date: string
  total: number
}

function buildDailySeries(dateFrom: string, dateTo: string, sales: { created_at: string; total: number; status: string }[]): DailyRevenuePoint[] {
  const byDay = new Map<string, number>()
  for (const sale of sales) {
    if (sale.status !== 'completed') continue
    const key = sale.created_at.slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + Number(sale.total))
  }

  const points: DailyRevenuePoint[] = []
  const cursor = new Date(dateFrom)
  const end = new Date(dateTo)
  cursor.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    points.push({ date: key, total: byDay.get(key) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return points
}

export function useDashboard(dateFrom: string, dateTo: string) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [lowStock, setLowStock] = useState<{ id: string; name: string; stock_quantity: number; min_stock: number }[]>([])
  const [dailySeries, setDailySeries] = useState<DailyRevenuePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getDashboardSummary(dateFrom, dateTo),
      getBestSellers(dateFrom, dateTo, 5),
      getLowStockProducts(),
      listSales(dateFrom, dateTo),
    ])
      .then(([s, b, l, sales]) => {
        if (cancelled) return
        setSummary(s)
        setBestSellers(b)
        setLowStock(l)
        setDailySeries(buildDailySeries(dateFrom, dateTo, sales))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo])

  return { summary, bestSellers, lowStock, dailySeries, loading }
}
