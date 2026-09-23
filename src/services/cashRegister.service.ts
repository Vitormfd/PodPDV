import { supabase } from '@/lib/supabaseClient'
import type { CashRegister, CashRegisterTotal } from '@/types/domain'

export async function getOpenRegister(): Promise<CashRegister | null> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('status', 'open')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function openRegister(openingBalance: number): Promise<CashRegister> {
  const { data, error } = await supabase.rpc('open_cash_register', {
    p_opening_balance: openingBalance,
  })
  if (error) throw error
  return data
}

export async function closeRegister(
  cashRegisterId: string,
  countedCash: number,
  notes: string | null
): Promise<CashRegister> {
  const { data, error } = await supabase.rpc('close_cash_register', {
    p_cash_register_id: cashRegisterId,
    p_counted_cash: countedCash,
    p_notes: notes,
  })
  if (error) throw error
  return data
}

export async function addManualMovement(input: {
  cashRegisterId: string
  direction: 'in' | 'out'
  amount: number
  description: string | null
}) {
  const { data, error } = await supabase.rpc('add_manual_cash_movement', {
    p_cash_register_id: input.cashRegisterId,
    p_direction: input.direction,
    p_amount: input.amount,
    p_description: input.description,
  })
  if (error) throw error
  return data
}

export async function getRegisterTotals(cashRegisterId: string): Promise<CashRegisterTotal[]> {
  const { data, error } = await supabase.rpc('get_cash_register_totals', {
    p_cash_register_id: cashRegisterId,
  })
  if (error) throw error
  return data ?? []
}

export async function listRegisterHistory(): Promise<CashRegister[]> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .order('opened_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function listRegisterMovements(cashRegisterId: string) {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('cash_register_id', cashRegisterId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
