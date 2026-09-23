import { useMemo, useState } from 'react'
import { Package, Plus, Pencil, Ban, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/LoadingState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductFormModal, type ProductFormValues } from '@/components/products/ProductFormModal'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/formatters'
import type { Product } from '@/types/domain'

export function ProductsPage() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const { categories } = useCategories()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)

  const filters = useMemo(
    () => ({ search: search || undefined, categoryId: categoryId || undefined, onlyActive }),
    [search, categoryId, onlyActive]
  )
  const { products, loading, add, edit, toggleActive } = useProducts(filters)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null)

  function openCreate() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleSubmit(values: ProductFormValues) {
    if (!profile) return
    const payload = {
      name: values.name.trim(),
      barcode: values.barcode.trim() || null,
      brand: values.brand.trim() || null,
      category_id: values.category_id || null,
      cost_price: Number(values.cost_price),
      sale_price: Number(values.sale_price),
      min_stock: Number(values.min_stock),
    }
    if (editingProduct) {
      await edit(editingProduct.id, payload)
      showToast('Produto atualizado com sucesso', 'success')
    } else {
      await add({ ...payload, store_id: profile.store_id, stock_quantity: Number(values.stock_quantity) })
      showToast('Produto cadastrado com sucesso', 'success')
    }
  }

  async function handleToggleActive() {
    if (!deactivateTarget) return
    await toggleActive(deactivateTarget.id, !deactivateTarget.is_active)
    showToast(deactivateTarget.is_active ? 'Produto desativado' : 'Produto reativado', 'success')
    setDeactivateTarget(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produtos"
        description="Catálogo, preços e controle de estoque"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        }
      />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou código de barras" className="sm:max-w-xs" />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="sm:max-w-48">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-ink-300">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-accent-600 focus:ring-accent-500 dark:border-ink-600"
          />
          Somente ativos
        </label>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Cadastre seu primeiro produto para começar a vender."
            action={
              <Button onClick={openCreate} variant="outline">
                <Plus className="h-4 w-4" />
                Novo produto
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th align="right">Custo</Th>
              <Th align="right">Venda</Th>
              <Th align="right">Estoque</Th>
              <Th align="center">Status</Th>
              <Th align="right">Ações</Th>
            </THead>
            <TBody>
              {products.map((product) => {
                const lowStock = product.stock_quantity <= product.min_stock
                const category = categories.find((c) => c.id === product.category_id)
                return (
                  <Tr key={product.id}>
                    <Td>
                      <p className="font-medium text-slate-900 dark:text-ink-100">{product.name}</p>
                      {product.brand && <p className="text-[11.5px] text-slate-400 dark:text-ink-500">{product.brand}</p>}
                    </Td>
                    <Td>{category?.name ?? '—'}</Td>
                    <Td align="right">{formatCurrency(product.cost_price)}</Td>
                    <Td align="right">{formatCurrency(product.sale_price)}</Td>
                    <Td align="right">
                      <span className="inline-flex items-center gap-1.5">
                        {product.stock_quantity}
                        {lowStock && <AlertTriangle className="h-3.5 w-3.5 text-warning-500" />}
                      </span>
                    </Td>
                    <Td align="center">
                      {product.is_active ? (
                        <Badge tone="success" dot>
                          Ativo
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Inativo</Badge>
                      )}
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateTarget(product)}
                          aria-label={product.is_active ? 'Desativar' : 'Reativar'}
                        >
                          {product.is_active ? (
                            <Ban className="h-4 w-4 text-danger-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success-500" />
                          )}
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        product={editingProduct}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleToggleActive}
        title={deactivateTarget?.is_active ? 'Desativar produto' : 'Reativar produto'}
        description={
          deactivateTarget?.is_active
            ? `"${deactivateTarget?.name}" deixará de aparecer no PDV, mas o histórico de vendas é preservado.`
            : `"${deactivateTarget?.name}" voltará a aparecer no PDV.`
        }
        confirmLabel={deactivateTarget?.is_active ? 'Desativar' : 'Reativar'}
        danger={deactivateTarget?.is_active}
      />
    </div>
  )
}
