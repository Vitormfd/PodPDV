import { useMemo, useState } from 'react'
import { HandCoins, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/LoadingState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentFormModal } from '@/components/fiado/PaymentFormModal'
import { useReceivables } from '@/hooks/useReceivables'
import { useCustomers } from '@/hooks/useCustomers'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { RECEIVABLE_STATUS_LABELS } from '@/lib/constants'
import type { Receivable } from '@/types/domain'

export function FiadoPage() {
  const { receivables, loading, pay } = useReceivables()
  const { customers } = useCustomers()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [paymentTarget, setPaymentTarget] = useState<Receivable | null>(null)

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? 'Cliente'

  const filtered = useMemo(() => {
    if (!search.trim()) return receivables
    const term = search.trim().toLowerCase()
    return receivables.filter((r) => customerName(r.customer_id).toLowerCase().includes(term))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivables, search, customers])

  const totalOpen = receivables.reduce((sum, r) => sum + Number(r.remaining_amount), 0)
  const debtorCount = new Set(receivables.map((r) => r.customer_id)).size

  async function handlePay(input: { amount: number; paymentMethod: Parameters<typeof pay>[1]['paymentMethod']; notes: string | null; allowOverpayment: boolean }) {
    if (!paymentTarget) return
    await pay(paymentTarget.id, input)
    showToast('Pagamento registrado com sucesso', 'success')
    setPaymentTarget(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Fiado" description="Contas a receber e pagamentos de clientes" />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <StatCard label="Total em aberto" value={formatCurrency(totalOpen)} icon={HandCoins} tone={totalOpen > 0 ? 'warning' : 'default'} />
        <StatCard label="Clientes devedores" value={String(debtorCount)} icon={Users} />
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cliente" className="max-w-xs" />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={HandCoins} title="Nenhuma venda fiada em aberto" description="Todas as contas estão em dia." />
        ) : (
          <Table>
            <THead>
              <Th>Cliente</Th>
              <Th>Data da venda</Th>
              <Th align="right">Valor original</Th>
              <Th align="right">Pago</Th>
              <Th align="right">Saldo</Th>
              <Th align="center">Status</Th>
              <Th align="right">Ações</Th>
            </THead>
            <TBody>
              {filtered.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium text-slate-900 dark:text-ink-100">{customerName(r.customer_id)}</Td>
                  <Td>{formatDate(r.created_at)}</Td>
                  <Td align="right">{formatCurrency(r.original_amount)}</Td>
                  <Td align="right">{formatCurrency(r.paid_amount)}</Td>
                  <Td align="right" className="font-semibold">
                    {formatCurrency(r.remaining_amount)}
                  </Td>
                  <Td align="center">
                    <Badge tone={r.status === 'paid' ? 'success' : r.status === 'partially_paid' ? 'warning' : 'danger'} dot>
                      {RECEIVABLE_STATUS_LABELS[r.status]}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <Button size="sm" variant="outline" onClick={() => setPaymentTarget(r)}>
                      Receber
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <PaymentFormModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        receivable={paymentTarget}
        onSubmit={handlePay}
      />
    </div>
  )
}
