import { useEffect, useState } from 'react'
import { getProfitReport } from '@/services/reports.service'
import { getDashboardSummary } from '@/services/dashboard.service'
import type { ProfitReportRow, DashboardSummary } from '@/types/domain'

export function useReports(dateFrom: string, dateTo: string) {
  const [rows, setRows] = useState<ProfitReportRow[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getProfitReport(dateFrom, dateTo), getDashboardSummary(dateFrom, dateTo)])
      .then(([r, s]) => {
        if (cancelled) return
        setRows(r)
        setSummary(s)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo])

  return { rows, summary, loading }
}
