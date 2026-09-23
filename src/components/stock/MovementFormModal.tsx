import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MANUAL_MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS, MOVEMENT_DIRECTION, type MovementType } from '@/lib/constants'
import type { Product } from '@/types/domain'

interface MovementFormModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onSubmit: (input: { productId: string; movementType: MovementType; quantity: number; unitCost: number | null; reason: string | null }) => Promise<void>
}

export function MovementFormModal({ open, onClose, products, onSubmit }: MovementFormModalProps) {
  const [productId, setProductId] = useState('')
  const [movementType, setMovementType] = useState<MovementType>('compra')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const direction = MOVEMENT_DIRECTION[movementType]
  const selectedProduct = products.find((p) => p.id === productId)

  useEffect(() => {
    if (open) {
      setProductId('')
      setMovementType('compra')
      setQuantity('1')
      setUnitCost('')
      setReason('')
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!productId) {
      setError('Selecione um produto')
      return
    }
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Quantidade inválida')
      return
    }
    if (direction === 'out' && selectedProduct && qty > selectedProduct.stock_quantity) {
      setError(`Estoque insuficiente (disponível: ${selectedProduct.stock_quantity})`)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        productId,
        movementType,
        quantity: qty,
        unitCost: unitCost ? Number(unitCost) : null,
        reason: reason.trim() || null,
      })
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
      title="Nova movimentação de estoque"
      size="md"
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}

        <Select label="Produto" required value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Selecione um produto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (estoque: {p.stock_quantity})
            </option>
          ))}
        </Select>

        <Select label="Tipo de movimentação" value={movementType} onChange={(e) => setMovementType(e.target.value as MovementType)}>
          {MANUAL_MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {MOVEMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Quantidade" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {direction === 'in' && (
            <Input
              label="Custo unitário"
              hint="Opcional"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          )}
        </div>

        <Textarea label="Motivo" hint="Opcional" value={reason} onChange={(e) => setReason(e.target.value)} />
      </form>
    </Modal>
  )
}
