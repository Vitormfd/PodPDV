import { useCallback, useEffect, useState } from 'react'
import { listCustomers, createCustomer, updateCustomer } from '@/services/customers.service'
import type { Customer } from '@/types/domain'
import type { Database } from '@/types/database.types'
import { useAuth } from '@/contexts/AuthContext'

type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export function useCustomers(search?: string) {
  const { profile } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCustomers(await listCustomers(search))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function add(input: { name: string; phone: string | null; cpf: string | null; notes: string | null }) {
    if (!profile) throw new Error('Usuário sem loja associada')
    const created = await createCustomer({ ...input, store_id: profile.store_id })
    setCustomers((prev) => [created, ...prev])
    return created
  }

  async function edit(id: string, input: CustomerUpdate) {
    const updated = await updateCustomer(id, input)
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  return { customers, loading, refresh, add, edit }
}
