import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp, ShoppingBag, HandCoins, AlertTriangle, Plus, Wallet, Trophy } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PeriodFilter } from '@/components/reports/PeriodFilter'
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart'
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown'
import { BestSellersList } from '@/components/dashboard/BestSellersList'
import { LowStockList } from '@/components/dashboard/LowStockList'
import { useDateRange } from '@/hooks/useDateRange'
import { useDashboard } from '@/hooks/useDashboard'
import { useCashRegister } from '@/contexts/CashRegisterContext'
import { formatCurrency } from '@/lib/formatters'

export function DashboardPage() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } = useDateRange('today')
  const { summary, bestSellers, lowStock, dailySeries, loading } = useDashboard(range.from, range.to)
  const { register } = useCashRegister()

  const avgTicket = summary && summary.sales_count > 0 ? summary.revenue / summary.sales_count : null
  const margin = summary && summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-[19px] font-semibold text-slate-900 dark:text-ink-50">Visão geral</h2>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-ink-400">
            Faturamento, estoque e caixa da loja em um só lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <PeriodFilter
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            onCustomFromChange={setCustomFrom}
            customTo={customTo}
            onCustomToChange={setCustomTo}
          />
          {!register && (
            <Link to="/caixa">
              <Button variant="outline" size="sm">
                <Wallet className="h-3.5 w-3.5" />
                Abrir caixa
              </Button>
            </Link>
          )}
          <Link to="/pdv">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova venda
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento"
          value={formatCurrency(summary?.revenue)}
          icon={DollarSign}
          loading={loading}
          hint={avgTicket !== null ? `Ticket médio: ${formatCurrency(avgTicket)}` : undefined}
        />
        <StatCard
          label="Lucro estimado"
          value={formatCurrency(summary?.profit)}
          icon={TrendingUp}
          tone="success"
          loading={loading}
          hint={margin !== null ? `Margem de ${margin.toFixed(1)}%` : undefined}
        />
        <StatCard
          label="Vendas realizadas"
          value={String(summary?.sales_count ?? 0)}
          icon={ShoppingBag}
          loading={loading}
          hint={summary && summary.discounts_given > 0 ? `${formatCurrency(summary.discounts_given)} em descontos` : undefined}
        />
        <StatCard
          label="Fiado em aberto"
          value={formatCurrency(summary?.open_receivables_total)}
          icon={HandCoins}
          tone={summary && summary.open_receivables_total > 0 ? 'warning' : 'default'}
          loading={loading}
          hint={summary && summary.debtor_count > 0 ? `${summary.debtor_count} cliente(s) devendo` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Vendas no período" description="Faturamento por dia" />
          <CardBody>{loading ? null : <SalesTrendChart points={dailySeries} />}</CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Formas de pagamento" />
          <CardBody>{loading ? null : <PaymentBreakdown data={summary?.by_payment_method ?? {}} />}</CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Produtos mais vendidos" description="No período selecionado" action={<Trophy className="h-4 w-4 text-slate-300 dark:text-ink-600" />} />
          <CardBody>{loading ? null : <BestSellersList items={bestSellers} />}</CardBody>
        </Card>

        <Card>
          <CardHeader title="Estoque baixo" description="No ou abaixo do mínimo cadastrado" />
          <CardBody>
            {loading ? null : lowStock.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="Estoque saudável" description="Nenhum produto está abaixo do mínimo." />
            ) : (
              <LowStockList items={lowStock} />
            )}
          </CardBody>
        </Card>
      </div>

      {summary && summary.open_receivables_total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-900 dark:bg-warning-950/60">
          <div className="flex items-center gap-2.5">
            <Badge tone="warning" dot>
              {summary.debtor_count} cliente(s)
            </Badge>
            <p className="text-[13px] text-warning-800 dark:text-warning-300">
              devem {formatCurrency(summary.open_receivables_total)} em vendas fiadas.
            </p>
          </div>
          <Link to="/fiado" className="text-[13px] font-medium text-warning-700 hover:underline dark:text-warning-300">
            Ver fiado
          </Link>
        </div>
      )}
    </div>
  )
}
