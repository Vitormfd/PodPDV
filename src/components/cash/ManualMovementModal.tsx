import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'

export function ManualMovementModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { direction: 'in' | 'out'; amount: number; description: string | null }) => Promise<void>
}) {
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(amount)
    if (Number.isNaN(value) || value <= 0) {
      setError('Informe um valor maior que zero')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ direction, amount: value, description: description.trim() || null })
      setAmount('')
      setDescription('')
      setDirection('in')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimentação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Movimentação manual de caixa"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Registrar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        <Select label="Tipo" value={direction} onChange={(e) => setDirection(e.target.value as 'in' | 'out')}>
          <option value="in">Entrada de dinheiro</option>
          <option value="out">Saída de dinheiro</option>
        </Select>
        <Input
          label="Valor"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Descrição"
          hint="Opcional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Sangria, troco para o caixa..."
        />
      </form>
    </Modal>
  )
}
