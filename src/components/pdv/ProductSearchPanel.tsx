import { useMemo, useState } from 'react'
import { PackageSearch, Plus } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/cn'
import type { Category, Product } from '@/types/domain'

export function ProductSearchPanel({
  products,
  categories,
  loading,
  onAdd,
}: {
  products: Product[]
  categories: Category[]
  loading: boolean
  onAdd: (product: Product) => void
}) {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const usedCategoryIds = useMemo(() => new Set(products.map((p) => p.category_id).filter(Boolean)), [products])
  const visibleCategories = categories.filter((c) => usedCategoryIds.has(c.id))

  const filtered = useMemo(() => {
    let list = products
    if (categoryId) list = list.filter((p) => p.category_id === categoryId)
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term)))
    }
    return list
  }, [products, search, categoryId])

  return (
    <div className="flex h-full flex-col">
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou código de barras..." autoFocus />

      {visibleCategories.length > 0 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryId(null)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
              categoryId === null
                ? 'border-accent-500 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-950 dark:text-accent-300'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-500'
            )}
          >
            Todos
          </button>
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                categoryId === c.id
                  ? 'border-accent-500 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-950 dark:text-accent-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-500'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={PackageSearch} title="Nenhum produto encontrado" description="Tente buscar por outro nome ou código." />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => {
              const outOfStock = product.stock_quantity <= 0
              const lowStock = !outOfStock && product.stock_quantity <= product.min_stock
              return (
                <button
                  key={product.id}
                  disabled={outOfStock}
                  onClick={() => onAdd(product)}
                  className="group relative flex flex-col rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-accent-300 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:shadow-none dark:border-ink-800 dark:bg-ink-900 dark:hover:border-accent-700"
                >
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-900 dark:text-ink-100">
                    {product.name}
                  </p>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <p className="font-display text-[15px] font-semibold tabular-nums text-slate-900 dark:text-ink-50">
                      {formatCurrency(product.sale_price)}
                    </p>
                    <span
                      className={cn(
                        'text-[10.5px] font-medium tabular-nums',
                        outOfStock
                          ? 'text-danger-500'
                          : lowStock
                            ? 'text-warning-600 dark:text-warning-400'
                            : 'text-slate-400 dark:text-ink-500'
                      )}
                    >
                      {outOfStock ? 'Sem estoque' : `${product.stock_quantity} un.`}
                    </span>
                  </div>
                  <div className="absolute right-2 top-2 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-accent-500 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
