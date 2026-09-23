import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { CustomerFormModal, type CustomerFormValues } from '@/components/customers/CustomerFormModal'
import { PaymentFormModal } from '@/components/fiado/PaymentFormModal'
import { getCustomer, getCustomerSales, getCustomerTotalSpent, updateCustomer } from '@/services/customers.service'
import { listCustomerReceivables } from '@/services/receivables.service'
import { useReceivables } from '@/hooks/useReceivables'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDateTime, formatPhone } from '@/lib/formatters'
import { PAYMENT_METHOD_LABELS, RECEIVABLE_STATUS_LABELS, type PaymentMethod } from '@/lib/constants'
import type { Customer, Sale, Receivable } from '@/types/domain'
import { DollarSign, ShoppingBag, HandCoins } from 'lucide-react'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const { pay } = useReceivables()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<Receivable | null>(null)

  async function loadAll() {
    if (!id) return
    setLoading(true)
    try {
      const [c, s, total, r] = await Promise.all([
        getCustomer(id),
        getCustomerSales(id),
        getCustomerTotalSpent(id),
        listCustomerReceivables(id),
      ])
      setCustomer(c)
      setSales(s)
      setTotalSpent(total)
      setReceivables(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openBalance = receivables.reduce((sum, r) => sum + (r.status !== 'paid' ? Number(r.remaining_amount) : 0), 0)

  async function handleEdit(values: CustomerFormValues) {
    if (!customer) return
    await updateCustomer(customer.id, {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      cpf: values.cpf.trim() || null,
      notes: values.notes.trim() || null,
    })
    await loadAll()
    showToast('Cliente atualizado', 'success')
  }

  async function handlePay(input: { amount: number; paymentMethod: Parameters<typeof pay>[1]['paymentMethod']; notes: string | null; allowOverpayment: boolean }) {
    if (!paymentTarget) return
    await pay(paymentTarget.id, input)
    await loadAll()
    showToast('Pagamento registrado com sucesso', 'success')
    setPaymentTarget(null)
  }

  if (loading) return <LoadingState label="Carregando cliente..." />
  if (!customer) return <p className="text-sm text-slate-500">Cliente não encontrado.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-ink-400 dark:hover:text-ink-200">
          <ArrowLeft className="h-4 w-4" />
          Voltar para clientes
        </Link>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-ink-100">{customer.name}</h2>
          <p className="text-sm text-slate-500 dark:text-ink-400">{formatPhone(customer.phone)}</p>
          {customer.notes && <p className="mt-2 text-sm text-slate-600 dark:text-ink-300">{customer.notes}</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total gasto" value={formatCurrency(totalSpent)} icon={DollarSign} />
        <StatCard label="Compras realizadas" value={String(sales.length)} icon={ShoppingBag} />
        <StatCard label="Fiado em aberto" value={formatCurrency(openBalance)} icon={HandCoins} tone={openBalance > 0 ? 'warning' : 'default'} />
      </div>

      {receivables.length > 0 && (
        <Card>
          <CardHeader title="Contas a receber" />
          <Table>
            <THead>
              <Th>Data</Th>
              <Th align="right">Original</Th>
              <Th align="right">Saldo</Th>
              <Th align="center">Status</Th>
              <Th align="right">Ações</Th>
            </THead>
            <TBody>
              {receivables.map((r) => (
                <Tr key={r.id}>
                  <Td>{formatDateTime(r.created_at)}</Td>
                  <Td align="right">{formatCurrency(r.original_amount)}</Td>
                  <Td align="right">{formatCurrency(r.remaining_amount)}</Td>
                  <Td align="center">
                    <Badge tone={r.status === 'paid' ? 'success' : r.status === 'partially_paid' ? 'warning' : 'danger'}>
                      {RECEIVABLE_STATUS_LABELS[r.status]}
                    </Badge>
                  </Td>
                  <Td align="right">
                    {r.status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => setPaymentTarget(r)}>
                        Receber
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader title="Histórico de compras" />
        {sales.length === 0 ? (
          <CardBody>
            <p className="text-sm text-slate-500 dark:text-ink-400">Nenhuma compra registrada ainda.</p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <Th>Data</Th>
              <Th>Forma de pagamento</Th>
              <Th align="right">Total</Th>
            </THead>
            <TBody>
              {sales.map((s) => (
                <Tr key={s.id}>
                  <Td>{formatDateTime(s.created_at)}</Td>
                  <Td>{PAYMENT_METHOD_LABELS[s.payment_method as PaymentMethod]}</Td>
                  <Td align="right">{formatCurrency(s.total)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleEdit} customer={customer} />
      <PaymentFormModal open={!!paymentTarget} onClose={() => setPaymentTarget(null)} receivable={paymentTarget} onSubmit={handlePay} />
    </div>
  )
}
