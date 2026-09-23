import { useEffect, useState } from 'react'
import { Banknote, QrCode, CreditCard, Landmark, HandCoins } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/constants'
import type { Customer } from '@/types/domain'
import { cn } from '@/lib/cn'

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  dinheiro: Banknote,
  pix: QrCode,
  debito: CreditCard,
  credito: Landmark,
  fiado: HandCoins,
}

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  customers: Customer[]
  onConfirm: (input: { paymentMethod: PaymentMethod; customerId: string | null; cashReceived: number | null }) => Promise<void>
  onRequestNewCustomer: () => void
}

export function PaymentModal({ open, onClose, total, customers, onConfirm, onRequestNewCustomer }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('dinheiro')
  const [customerId, setCustomerId] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMethod('dinheiro')
      setCustomerId('')
      setCashReceived('')
      setError(null)
    }
  }, [open])

  const change = method === 'dinheiro' && cashReceived ? Math.max(0, Number(cashReceived) - total) : 0
  const insufficientCash = method === 'dinheiro' && cashReceived !== '' && Number(cashReceived) < total

  async function handleConfirm() {
    setError(null)
    if (method === 'fiado' && !customerId) {
      setError('Selecione um cliente para venda fiada')
      return
    }
    if (insufficientCash) {
      setError('Valor recebido é menor que o total da venda')
      return
    }
    setSubmitting(true)
    try {
      await onConfirm({
        paymentMethod: method,
        customerId: method === 'fiado' ? customerId : null,
        cashReceived: method === 'dinheiro' && cashReceived ? Number(cashReceived) : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar a venda')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar venda"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={submitting}>
            Confirmar venda
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-ink-950/60">
          <span className="text-[13px] text-slate-500 dark:text-ink-400">Total a pagar</span>
          <span className="font-display text-xl font-semibold tabular-nums text-slate-900 dark:text-ink-50">
            {formatCurrency(total)}
          </span>
        </div>

        {error && (
          <p className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-[13px] text-danger-700 dark:border-danger-900 dark:bg-danger-950 dark:text-danger-300">
            {error}
          </p>
        )}

        <div>
          <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-ink-300">Forma de pagamento</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICONS[m]
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-[12.5px] font-medium transition-colors',
                    method === m
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-950 dark:text-accent-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-ink-800 dark:text-ink-400 dark:hover:bg-ink-800'
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              )
            })}
          </div>
        </div>

        {method === 'fiado' && (
          <div className="space-y-2">
            <Select label="Cliente" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Selecione um cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <button type="button" onClick={onRequestNewCustomer} className="text-[12.5px] font-medium text-accent-600 hover:underline dark:text-accent-400">
              + Cadastrar novo cliente
            </button>
          </div>
        )}

        {method === 'dinheiro' && (
          <div className="space-y-2">
            <Input
              label="Valor recebido"
              type="number"
              min="0"
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder={formatCurrency(total)}
              error={insufficientCash ? 'Valor menor que o total' : undefined}
            />
            {change > 0 && (
              <div className="flex items-center justify-between rounded-md bg-success-50 px-3 py-2 dark:bg-success-950/60">
                <span className="text-[13px] font-medium text-success-700 dark:text-success-400">Troco</span>
                <span className="font-display text-[15px] font-semibold tabular-nums text-success-700 dark:text-success-400">
                  {formatCurrency(change)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
