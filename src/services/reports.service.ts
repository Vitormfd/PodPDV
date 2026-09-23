import { supabase } from '@/lib/supabaseClient'
import type { ProfitReportRow } from '@/types/domain'

export async function getProfitReport(dateFrom: string, dateTo: string): Promise<ProfitReportRow[]> {
  const { data, error } = await supabase.rpc('get_profit_report', {
    p_date_from: dateFrom,
    p_date_to: dateTo,
  })
  if (error) throw error
  return data ?? []
}
