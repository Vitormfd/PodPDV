import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/formatters'
import type { CartItem } from '@/types/domain'

interface CartProps {
  items: CartItem[]
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onRemove: (productId: string) => void
  discount: number
  onDiscountChange: (value: number) => void
  subtotal: number
  total: number
  onCheckout: () => void
}

export function Cart({ items, onIncrement, onDecrement, onRemove, discount, onDiscountChange, subtotal, total, onCheckout }: CartProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-ink-800">
        <h3 className="text-[13px] font-semibold text-slate-800 dark:text-ink-100">Carrinho</h3>
        {items.length > 0 && (
          <span className="text-[12px] tabular-nums text-slate-400 dark:text-ink-500">
            {items.reduce((sum, i) => sum + i.quantity, 0)} item(ns)
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Carrinho vazio" description="Clique em um produto para adicionar à venda." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-ink-800/70">
            {items.map((item) => {
              const lineTotal = item.product.sale_price * item.quantity - item.discount
              return (
                <li key={item.product.id} className="flex items-start gap-2.5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-900 dark:text-ink-100">{item.product.name}</p>
                    <p className="text-[11.5px] text-slate-400 dark:text-ink-500">{formatCurrency(item.product.sale_price)} un.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => onDecrement(item.product.id)}
                      className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-[12.5px] font-medium tabular-nums text-slate-900 dark:text-ink-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onIncrement(item.product.id)}
                      disabled={item.quantity >= item.product.stock_quantity}
                      className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="w-[68px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-900 dark:text-ink-100">
                    {formatCurrency(lineTotal)}
                  </p>
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="shrink-0 text-slate-300 hover:text-danger-500 dark:text-ink-600 dark:hover:text-danger-400"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-2.5 border-t border-slate-200 pt-3.5 dark:border-ink-800">
          <div className="flex items-center justify-between text-[13px] text-slate-500 dark:text-ink-400">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] text-slate-500 dark:text-ink-400">Desconto</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount || ''}
              onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
              className="h-7.5 w-24 text-right text-[13px]"
            />
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5 text-[15px] font-semibold text-slate-900 dark:border-ink-800 dark:text-ink-50">
            <span className="font-display">Total</span>
            <span className="font-display tabular-nums">{formatCurrency(total)}</span>
          </div>
          <Button className="w-full" size="lg" onClick={onCheckout}>
            Finalizar venda
          </Button>
        </div>
      )}
    </div>
  )
}
