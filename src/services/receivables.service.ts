import { supabase } from '@/lib/supabaseClient'
import type { Receivable, ReceivablePayment } from '@/types/domain'
import type { ReceivablePaymentMethod } from '@/lib/constants'

export async function listReceivables(status?: 'open' | 'partially_paid' | 'paid'): Promise<Receivable[]> {
  let query = supabase.from('receivables').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.neq('status', 'paid')
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function listCustomerReceivables(customerId: string): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('receivables')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listReceivablePayments(receivableId: string): Promise<ReceivablePayment[]> {
  const { data, error } = await supabase
    .from('receivable_payments')
    .select('*')
    .eq('receivable_id', receivableId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function registerReceivablePayment(input: {
  receivableId: string
  amount: number
  paymentMethod: ReceivablePaymentMethod
  notes: string | null
  allowOverpayment?: boolean
}): Promise<ReceivablePayment> {
  const { data, error } = await supabase.rpc('register_receivable_payment', {
    p_receivable_id: input.receivableId,
    p_amount: input.amount,
    p_payment_method: input.paymentMethod,
    p_notes: input.notes,
    p_allow_overpayment: input.allowOverpayment ?? false,
  })
  if (error) throw error
  return data
}

export async function getOpenReceivablesTotal(): Promise<number> {
  const { data, error } = await supabase.from('receivables').select('remaining_amount').neq('status', 'paid')
  if (error) throw error
  return (data ?? []).reduce((sum, r) => sum + Number(r.remaining_amount), 0)
}
