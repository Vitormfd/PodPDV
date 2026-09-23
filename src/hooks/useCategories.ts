import { useCallback, useEffect, useState } from 'react'
import { listCategories, createCategory, deleteCategory } from '@/services/categories.service'
import type { Category } from '@/types/domain'
import { useAuth } from '@/contexts/AuthContext'

export function useCategories() {
  const { profile } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCategories(await listCategories())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addCategory(name: string) {
    if (!profile) throw new Error('Usuário sem loja associada')
    const created = await createCategory(name, profile.store_id)
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  async function removeCategory(id: string) {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return { categories, loading, refresh, addCategory, removeCategory }
}
