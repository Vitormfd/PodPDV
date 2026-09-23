import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function OpenRegisterModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (openingBalance: number) => Promise<void>
}) {
  const [balance, setBalance] = useState('0')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(balance)
    if (Number.isNaN(value) || value < 0) {
      setError('Informe um valor válido')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(value)
      setBalance('0')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir o caixa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abrir caixa"
      description="Informe o valor inicial em dinheiro disponível na gaveta."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Abrir caixa
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        <Input
          label="Saldo inicial"
          type="number"
          min="0"
          step="0.01"
          autoFocus
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </form>
    </Modal>
  )
}
