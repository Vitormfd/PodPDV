import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { RECEIVABLE_PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type ReceivablePaymentMethod } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import type { Receivable } from '@/types/domain'

interface PaymentFormModalProps {
  open: boolean
  onClose: () => void
  receivable: Receivable | null
  onSubmit: (input: {
    amount: number
    paymentMethod: ReceivablePaymentMethod
    notes: string | null
    allowOverpayment: boolean
  }) => Promise<void>
}

export function PaymentFormModal({ open, onClose, receivable, onSubmit }: PaymentFormModalProps) {
  const { profile } = useAuth()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<ReceivablePaymentMethod>('dinheiro')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canOverpay = profile?.role === 'owner' || profile?.role === 'manager'

  useEffect(() => {
    if (open && receivable) {
      setAmount(String(receivable.remaining_amount))
      setMethod('dinheiro')
      setNotes('')
      setError(null)
    }
  }, [open, receivable])

  if (!receivable) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(amount)
    if (Number.isNaN(value) || value <= 0) {
      setError('Informe um valor maior que zero')
      return
    }
    const exceeds = value > Number(receivable!.remaining_amount)
    if (exceeds && !canOverpay) {
      setError('Valor maior que o saldo pendente. Apenas gerente/proprietário pode autorizar.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ amount: value, paymentMethod: method, notes: notes.trim() || null, allowOverpayment: exceeds })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receber pagamento"
      description={`Saldo pendente: ${formatCurrency(receivable.remaining_amount)}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Registrar pagamento
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        <Input
          label="Valor recebido"
          type="number"
          min="0.01"
          step="0.01"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Forma de pagamento" value={method} onChange={(e) => setMethod(e.target.value as ReceivablePaymentMethod)}>
          {RECEIVABLE_PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </Select>
        <Textarea label="Observações" hint="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  )
}
