import { useState } from 'react'
import { Wallet, Plus, Lock, History } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { OpenRegisterModal } from '@/components/cash/OpenRegisterModal'
import { CloseRegisterModal } from '@/components/cash/CloseRegisterModal'
import { ManualMovementModal } from '@/components/cash/ManualMovementModal'
import { useCashRegister } from '@/contexts/CashRegisterContext'
import { useCashRegisterHistory, useRegisterMovements } from '@/hooks/useCashRegisterHistory'
import { openRegister, closeRegister, addManualMovement } from '@/services/cashRegister.service'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { CASH_REGISTER_STATUS_LABELS } from '@/lib/constants'

export function CashRegisterPage() {
  const { register, refresh: refreshCurrent } = useCashRegister()
  const { history, loading: historyLoading, refresh: refreshHistory } = useCashRegisterHistory()
  const { movements } = useRegisterMovements(register?.id ?? null)
  const { showToast } = useToast()

  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)

  async function handleOpen(balance: number) {
    await openRegister(balance)
    await Promise.all([refreshCurrent(), refreshHistory()])
    showToast('Caixa aberto com sucesso', 'success')
  }

  async function handleClose(counted: number, notes: string | null) {
    if (!register) return
    await closeRegister(register.id, counted, notes)
    await Promise.all([refreshCurrent(), refreshHistory()])
    showToast('Caixa fechado com sucesso', 'success')
  }

  async function handleManualMovement(input: { direction: 'in' | 'out'; amount: number; description: string | null }) {
    if (!register) return
    await addManualMovement({ cashRegisterId: register.id, ...input })
    showToast('Movimentação registrada', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Caixa" description="Abertura, fechamento e movimentações do dia" />

      <Card>
        <CardHeader
          title={register ? 'Caixa aberto' : 'Nenhum caixa aberto'}
          description={
            register
              ? `Aberto em ${formatDateTime(register.opened_at)} com saldo inicial de ${formatCurrency(register.opening_balance)}`
              : 'Abra o caixa para começar a registrar vendas.'
          }
          action={
            register ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setMovementModal(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Movimentação
                </Button>
                <Button variant="danger" size="sm" onClick={() => setCloseModal(true)}>
                  <Lock className="h-3.5 w-3.5" />
                  Fechar caixa
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setOpenModal(true)}>
                <Wallet className="h-3.5 w-3.5" />
                Abrir caixa
              </Button>
            )
          }
        />
        {register && (
          <CardBody>
            {movements.length === 0 ? (
              <p className="text-[13px] text-slate-500 dark:text-ink-400">Nenhuma movimentação registrada ainda.</p>
            ) : (
              <div className="-mx-5">
                <Table>
                  <THead>
                    <Th>Tipo</Th>
                    <Th>Forma</Th>
                    <Th align="right">Valor</Th>
                    <Th>Quando</Th>
                  </THead>
                  <TBody>
                    {movements.slice(0, 10).map((m) => (
                      <Tr key={m.id}>
                        <Td>
                          <Badge tone={m.direction === 'in' ? 'success' : 'danger'} dot>
                            {m.movement_type === 'sale'
                              ? 'Venda'
                              : m.movement_type === 'receivable_payment'
                                ? 'Pagamento fiado'
                                : m.direction === 'in'
                                  ? 'Entrada manual'
                                  : 'Saída manual'}
                          </Badge>
                        </Td>
                        <Td>{m.payment_method ?? '—'}</Td>
                        <Td align="right" className={m.direction === 'out' ? 'text-danger-600 dark:text-danger-400' : ''}>
                          {m.direction === 'out' ? '-' : ''}
                          {formatCurrency(m.amount)}
                        </Td>
                        <Td>{formatDateTime(m.created_at)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader title="Histórico de caixas" description="Últimos caixas abertos e fechados" />
        {historyLoading ? null : history.length === 0 ? (
          <EmptyState icon={History} title="Nenhum histórico ainda" />
        ) : (
          <Table>
            <THead>
              <Th>Status</Th>
              <Th>Aberto em</Th>
              <Th>Fechado em</Th>
              <Th align="right">Saldo inicial</Th>
              <Th align="right">Esperado</Th>
              <Th align="right">Contado</Th>
              <Th align="right">Diferença</Th>
            </THead>
            <TBody>
              {history.map((h) => (
                <Tr key={h.id}>
                  <Td>
                    <Badge tone={h.status === 'open' ? 'success' : 'neutral'} dot>
                      {CASH_REGISTER_STATUS_LABELS[h.status]}
                    </Badge>
                  </Td>
                  <Td>{formatDateTime(h.opened_at)}</Td>
                  <Td>{formatDateTime(h.closed_at)}</Td>
                  <Td align="right">{formatCurrency(h.opening_balance)}</Td>
                  <Td align="right">{h.expected_cash != null ? formatCurrency(h.expected_cash) : '—'}</Td>
                  <Td align="right">{h.counted_cash != null ? formatCurrency(h.counted_cash) : '—'}</Td>
                  <Td align="right">
                    {h.difference != null ? (
                      <span className={Math.abs(h.difference) > 0.001 ? (h.difference < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400') : ''}>
                        {formatCurrency(h.difference)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <OpenRegisterModal open={openModal} onClose={() => setOpenModal(false)} onSubmit={handleOpen} />
      <CloseRegisterModal open={closeModal} onClose={() => setCloseModal(false)} onSubmit={handleClose} register={register} />
      <ManualMovementModal open={movementModal} onClose={() => setMovementModal(false)} onSubmit={handleManualMovement} />
    </div>
  )
}
