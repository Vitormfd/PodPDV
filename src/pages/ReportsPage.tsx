import { Info, DollarSign, TrendingUp, Percent, HandCoins, BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { PeriodFilter } from '@/components/reports/PeriodFilter'
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown'
import { useDateRange } from '@/hooks/useDateRange'
import { useReports } from '@/hooks/useReports'
import { formatCurrency } from '@/lib/formatters'

export function ReportsPage() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } = useDateRange('month')
  const { rows, summary, loading } = useReports(range.from, range.to)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader title="Relatórios" description="Lucro, custos e desempenho financeiro" />
        <PeriodFilter
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          onCustomFromChange={setCustomFrom}
          customTo={customTo}
          onCustomToChange={setCustomTo}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita bruta" value={formatCurrency(summary?.revenue)} icon={DollarSign} loading={loading} />
        <StatCard label="Lucro bruto" value={formatCurrency(summary?.profit)} icon={TrendingUp} tone="success" loading={loading} />
        <StatCard label="Descontos concedidos" value={formatCurrency(summary?.discounts_given)} icon={Percent} loading={loading} />
        <StatCard label="Fiado em aberto" value={formatCurrency(summary?.open_receivables_total)} icon={HandCoins} loading={loading} />
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-[13px] text-accent-800 dark:border-accent-900 dark:bg-accent-950/60 dark:text-accent-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>O lucro exibido considera apenas receita menos custo dos produtos vendidos. Despesas operacionais não cadastradas no sistema não são descontadas.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Vendas por forma de pagamento" />
          <CardBody>{loading ? null : <PaymentBreakdown data={summary?.by_payment_method ?? {}} />}</CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Lucro por produto" description="No período selecionado" />
          {rows.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sem dados para o período" />
          ) : (
            <Table>
              <THead>
                <Th>Produto</Th>
                <Th align="right">Qtd.</Th>
                <Th align="right">Receita</Th>
                <Th align="right">Custo</Th>
                <Th align="right">Lucro</Th>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Tr key={row.product_id}>
                    <Td className="font-medium text-slate-900 dark:text-ink-100">{row.product_name}</Td>
                    <Td align="right">{row.quantity_sold}</Td>
                    <Td align="right">{formatCurrency(row.revenue)}</Td>
                    <Td align="right">{formatCurrency(row.cost)}</Td>
                    <Td align="right" className="font-semibold text-success-600 dark:text-success-400">
                      {formatCurrency(row.profit)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
