import { useCallback, useEffect, useState } from 'react'
import { listRegisterHistory, listRegisterMovements } from '@/services/cashRegister.service'
import type { CashRegister, CashMovement } from '@/types/domain'

export function useCashRegisterHistory() {
  const [history, setHistory] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setHistory(await listRegisterHistory())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { history, loading, refresh }
}

export function useRegisterMovements(cashRegisterId: string | null) {
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!cashRegisterId) {
      setMovements([])
      return
    }
    setLoading(true)
    try {
      setMovements(await listRegisterMovements(cashRegisterId))
    } finally {
      setLoading(false)
    }
  }, [cashRegisterId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { movements, loading, refresh }
}
