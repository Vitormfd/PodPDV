import { supabase } from '@/lib/supabaseClient'
import type { Category } from '@/types/domain'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string, storeId: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
