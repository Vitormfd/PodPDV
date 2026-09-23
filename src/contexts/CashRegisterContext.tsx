import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getOpenRegister } from '@/services/cashRegister.service'
import type { CashRegister } from '@/types/domain'
import { useAuth } from './AuthContext'

interface CashRegisterContextValue {
  register: CashRegister | null
  loading: boolean
  refresh: () => Promise<void>
}

const CashRegisterContext = createContext<CashRegisterContextValue | undefined>(undefined)

export function CashRegisterProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!profile) {
      setRegister(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const open = await getOpenRegister()
      setRegister(open)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <CashRegisterContext.Provider value={{ register, loading, refresh }}>
      {children}
    </CashRegisterContext.Provider>
  )
}

export function useCashRegister() {
  const ctx = useContext(CashRegisterContext)
  if (!ctx) throw new Error('useCashRegister deve ser usado dentro de CashRegisterProvider')
  return ctx
}
