import { useCallback, useEffect, useState } from 'react'
import { listProducts, createProduct, updateProduct, setProductActive, type ProductFilters } from '@/services/products.service'
import type { Product } from '@/types/domain'
import type { Database } from '@/types/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export function useProducts(filters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await listProducts(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.categoryId, filters.onlyActive, filters.onlyLowStock])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function add(input: ProductInsert) {
    const created = await createProduct(input)
    setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  async function edit(id: string, input: ProductUpdate) {
    const updated = await updateProduct(id, input)
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  async function toggleActive(id: string, active: boolean) {
    const updated = await setProductActive(id, active)
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  return { products, loading, error, refresh, add, edit, toggleActive }
}
