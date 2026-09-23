import { useCallback, useEffect, useState } from 'react'
import { listReceivables, registerReceivablePayment } from '@/services/receivables.service'
import type { Receivable } from '@/types/domain'
import type { ReceivablePaymentMethod } from '@/lib/constants'
import { useCashRegister } from '@/contexts/CashRegisterContext'

export function useReceivables() {
  const { register } = useCashRegister()
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setReceivables(await listReceivables())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function pay(
    receivableId: string,
    input: { amount: number; paymentMethod: ReceivablePaymentMethod; notes: string | null; allowOverpayment: boolean }
  ) {
    await registerReceivablePayment({
      receivableId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      cashRegisterId: register?.id ?? null,
      notes: input.notes,
      allowOverpayment: input.allowOverpayment,
    })
    await refresh()
  }

  return { receivables, loading, refresh, pay }
}
