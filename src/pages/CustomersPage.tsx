import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/LoadingState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { CustomerFormModal, type CustomerFormValues } from '@/components/customers/CustomerFormModal'
import { useCustomers } from '@/hooks/useCustomers'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatPhone } from '@/lib/formatters'
import { listReceivables } from '@/services/receivables.service'
import type { Receivable } from '@/types/domain'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const { customers, loading, add, refresh } = useCustomers(search || undefined)
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [openBalances, setOpenBalances] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    listReceivables().then((rows: Receivable[]) => {
      const map = new Map<string, number>()
      rows.forEach((r) => map.set(r.customer_id, (map.get(r.customer_id) ?? 0) + Number(r.remaining_amount)))
      setOpenBalances(map)
    })
  }, [customers.length])

  async function handleAdd(values: CustomerFormValues) {
    await add({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      cpf: values.cpf.trim() || null,
      notes: values.notes.trim() || null,
    })
    await refresh()
    showToast('Cliente cadastrado com sucesso', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="Cadastro, histórico de compras e fiado"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone" className="sm:max-w-xs" />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente cadastrado"
            description="Cadastre clientes para habilitar vendas fiadas e histórico de compras."
            action={
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>Nome</Th>
              <Th>Telefone</Th>
              <Th align="right">Fiado em aberto</Th>
              <Th align="right"></Th>
            </THead>
            <TBody>
              {customers.map((customer) => {
                const balance = openBalances.get(customer.id) ?? 0
                return (
                  <Tr key={customer.id}>
                    <Td className="font-medium text-slate-900 dark:text-ink-100">{customer.name}</Td>
                    <Td>{formatPhone(customer.phone)}</Td>
                    <Td align="right">
                      {balance > 0 ? (
                        <Badge tone="warning">{formatCurrency(balance)}</Badge>
                      ) : (
                        <span className="text-slate-300 dark:text-ink-600">—</span>
                      )}
                    </Td>
                    <Td align="right">
                      <Link to={`/clientes/${customer.id}`}>
                        <Button variant="ghost" size="icon" aria-label="Ver detalhes">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </Td>
                  </Tr>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
