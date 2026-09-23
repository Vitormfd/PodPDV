import { supabase } from '@/lib/supabaseClient'
import type { Customer, Sale } from '@/types/domain'
import type { Database } from '@/types/database.types'

type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export async function listCustomers(search?: string): Promise<Customer[]> {
  let query = supabase.from('customers').select('*').order('name')
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createCustomer(input: CustomerInsert): Promise<Customer> {
  const { data, error } = await supabase.from('customers').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCustomer(id: string, input: CustomerUpdate): Promise<Customer> {
  const { data, error } = await supabase.from('customers').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getCustomerSales(customerId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCustomerTotalSpent(customerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
  if (error) throw error
  return (data ?? []).reduce((sum, s) => sum + Number(s.total), 0)
}
