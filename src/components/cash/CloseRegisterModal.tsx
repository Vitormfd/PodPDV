import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { getRegisterTotals } from '@/services/cashRegister.service'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'
import type { CashRegister } from '@/types/domain'

export function CloseRegisterModal({
  open,
  onClose,
  onSubmit,
  register,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (countedCash: number, notes: string | null) => Promise<void>
  register: CashRegister | null
}) {
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<{ payment_method: string | null; direction: string; total: number }[]>([])
  const [expectedCash, setExpectedCash] = useState(0)

  useEffect(() => {
    if (!open || !register) return
    getRegisterTotals(register.id).then((rows) => {
      setTotals(rows)
      const cashIn = rows.filter((r) => r.payment_method === 'dinheiro' && r.direction === 'in').reduce((s, r) => s + Number(r.total), 0)
      const cashOut = rows.filter((r) => r.payment_method === 'dinheiro' && r.direction === 'out').reduce((s, r) => s + Number(r.total), 0)
      setExpectedCash(Number(register.opening_balance) + cashIn - cashOut)
    })
  }, [open, register])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(counted)
    if (Number.isNaN(value) || value < 0) {
      setError('Informe um valor válido')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(value, notes.trim() || null)
      setCounted('')
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fechar o caixa')
    } finally {
      setSubmitting(false)
    }
  }

  const difference = counted ? Number(counted) - expectedCash : null

  const byMethod = Object.entries(PAYMENT_METHOD_LABELS)
    .filter(([key]) => key !== 'fiado')
    .map(([key, label]) => {
      const total = totals
        .filter((t) => t.payment_method === key && t.direction === 'in')
        .reduce((s, t) => s + Number(t.total), 0)
      return { key, label, total }
    })
    .filter((row) => row.total > 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fechar caixa"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Fechar caixa
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}

        {byMethod.length > 0 && (
          <div className="rounded-lg border border-slate-200 dark:border-ink-800">
            <div className="border-b border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-ink-800 dark:text-ink-400">
              Recebido por forma de pagamento
            </div>
            <div className="divide-y divide-slate-200 dark:divide-ink-800">
              {byMethod.map((row) => (
                <div key={row.key} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-slate-600 dark:text-ink-300">{row.label}</span>
                  <span className="font-medium tabular-nums text-slate-900 dark:text-ink-100">
                    {formatCurrency(row.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-ink-800/60">
          <p className="text-sm text-slate-600 dark:text-ink-300">
            Saldo esperado em dinheiro: <span className="font-semibold text-slate-900 dark:text-ink-100">{formatCurrency(expectedCash)}</span>
          </p>
        </div>

        <Input
          label="Valor contado na gaveta"
          type="number"
          min="0"
          step="0.01"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          autoFocus
        />

        {difference !== null && Math.abs(difference) > 0.001 && (
          <p className={`text-sm font-medium ${difference < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
            Diferença: {difference > 0 ? '+' : ''}
            {formatCurrency(difference)}
          </p>
        )}

        <Textarea
          label="Observações"
          hint="Opcional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  )
}
