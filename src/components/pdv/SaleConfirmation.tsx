import { CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/formatters'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/constants'
import type { Sale } from '@/types/domain'

export function SaleConfirmation({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  if (!sale) return null

  return (
    <Modal
      open={!!sale}
      onClose={onClose}
      title="Venda concluída"
      size="sm"
      footer={
        <Button className="w-full" onClick={onClose}>
          Nova venda
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-3 py-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-950">
          <CheckCircle2 className="h-6 w-6 text-success-600 dark:text-success-400" />
        </div>
        <p className="font-display text-3xl font-semibold tabular-nums text-slate-900 dark:text-ink-50">
          {formatCurrency(sale.total)}
        </p>
        <p className="text-[13px] text-slate-500 dark:text-ink-400">
          {PAYMENT_METHOD_LABELS[sale.payment_method as PaymentMethod]}
        </p>
        {sale.change_given != null && Number(sale.change_given) > 0 && (
          <p className="text-[13px] font-medium text-slate-700 dark:text-ink-300">
            Troco: {formatCurrency(sale.change_given)}
          </p>
        )}
      </div>
    </Modal>
  )
}
