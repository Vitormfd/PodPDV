import { supabase } from '@/lib/supabaseClient'
import type { CartItem, Sale, SaleItem } from '@/types/domain'
import type { PaymentMethod } from '@/lib/constants'

export interface CreateSaleInput {
  cashRegisterId: string
  customerId: string | null
  items: CartItem[]
  discount: number
  paymentMethod: PaymentMethod
  cashReceived: number | null
  idempotencyKey: string
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const items = input.items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.sale_price,
    discount: item.discount,
  }))

  const { data, error } = await supabase.rpc('create_sale', {
    p_cash_register_id: input.cashRegisterId,
    p_customer_id: input.customerId,
    p_items: items,
    p_discount: input.discount,
    p_payment_method: input.paymentMethod,
    p_cash_received: input.cashReceived,
    p_idempotency_key: input.idempotencyKey,
  })

  if (error) throw error
  return data
}

export async function listSales(dateFrom: string, dateTo: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase.from('sale_items').select('*').eq('sale_id', saleId)
  if (error) throw error
  return data ?? []
}
