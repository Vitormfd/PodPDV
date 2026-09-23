import { supabase } from '@/lib/supabaseClient'
import type { BestSeller, DashboardSummary } from '@/types/domain'

export async function getDashboardSummary(dateFrom: string, dateTo: string): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_date_from: dateFrom,
    p_date_to: dateTo,
  })
  if (error) throw error
  return data as unknown as DashboardSummary
}

export async function getBestSellers(dateFrom: string, dateTo: string, limit = 5): Promise<BestSeller[]> {
  const { data, error } = await supabase.rpc('get_best_sellers', {
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_limit: limit,
  })
  if (error) throw error
  return data ?? []
}

export async function getLowStockProducts() {
  const { data, error } = await supabase.rpc('get_low_stock_products')
  if (error) throw error
  return data ?? []
}
