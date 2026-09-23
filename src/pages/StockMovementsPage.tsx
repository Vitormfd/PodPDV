import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/LoadingState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { MovementFormModal } from '@/components/stock/MovementFormModal'
import { useProducts } from '@/hooks/useProducts'
import { registerInventoryMovement, listMovements } from '@/services/inventoryMovements.service'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime } from '@/lib/formatters'
import { MOVEMENT_TYPE_LABELS } from '@/lib/constants'
import type { InventoryMovement } from '@/types/domain'

const ALL_PRODUCTS_FILTERS = {}

export function StockMovementsPage() {
  const { products, refresh: refreshProducts } = useProducts(ALL_PRODUCTS_FILTERS)
  const { showToast } = useToast()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const loadMovements = useCallback(async () => {
    setLoading(true)
    try {
      setMovements(await listMovements())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  async function handleSubmit(input: Parameters<typeof registerInventoryMovement>[0]) {
    await registerInventoryMovement(input)
    await Promise.all([loadMovements(), refreshProducts()])
    showToast('Movimentação registrada com sucesso', 'success')
  }

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? 'Produto removido'

  return (
    <div className="space-y-4">
      <PageHeader
        title="Movimentações de estoque"
        description="Histórico de entradas e saídas manuais"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova movimentação
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : movements.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="Nenhuma movimentação registrada" description="Registre compras, ajustes, perdas ou devoluções." />
        ) : (
          <Table>
            <THead>
              <Th>Produto</Th>
              <Th>Tipo</Th>
              <Th align="right">Quantidade</Th>
              <Th>Motivo</Th>
              <Th>Data</Th>
            </THead>
            <TBody>
              {movements.map((m) => (
                <Tr key={m.id}>
                  <Td className="font-medium text-slate-900 dark:text-ink-100">{productName(m.product_id)}</Td>
                  <Td>
                    <Badge tone={m.direction === 'in' ? 'success' : 'danger'} dot>
                      {MOVEMENT_TYPE_LABELS[m.movement_type]}
                    </Badge>
                  </Td>
                  <Td align="right">
                    {m.direction === 'out' ? '-' : '+'}
                    {m.quantity}
                  </Td>
                  <Td>{m.reason ?? '—'}</Td>
                  <Td>{formatDateTime(m.created_at)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <MovementFormModal open={formOpen} onClose={() => setFormOpen(false)} products={products} onSubmit={handleSubmit} />
    </div>
  )
}
