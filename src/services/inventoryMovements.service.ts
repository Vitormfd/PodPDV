import { supabase } from '@/lib/supabaseClient'
import type { InventoryMovement } from '@/types/domain'
import type { MovementType } from '@/lib/constants'

export async function registerInventoryMovement(input: {
  productId: string
  movementType: MovementType
  quantity: number
  unitCost: number | null
  reason: string | null
}): Promise<InventoryMovement> {
  const { data, error } = await supabase.rpc('register_inventory_movement', {
    p_product_id: input.productId,
    p_movement_type: input.movementType,
    p_quantity: input.quantity,
    p_unit_cost: input.unitCost,
    p_reason: input.reason,
  })
  if (error) throw error
  return data
}

export async function listMovements(productId?: string): Promise<InventoryMovement[]> {
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (productId) {
    query = query.eq('product_id', productId)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
