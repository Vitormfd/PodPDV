import { supabase } from '@/lib/supabaseClient'
import type { Product } from '@/types/domain'
import type { Database } from '@/types/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductFilters {
  search?: string
  categoryId?: string | null
  onlyActive?: boolean
  onlyLowStock?: boolean
}

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('name', { ascending: true })

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`)
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error

  if (filters.onlyLowStock) {
    return (data ?? []).filter((p) => p.stock_quantity <= p.min_stock)
  }
  return data ?? []
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createProduct(input: ProductInsert): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, input: ProductUpdate): Promise<Product> {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function setProductActive(id: string, isActive: boolean): Promise<Product> {
  return updateProduct(id, { is_active: isActive })
}
