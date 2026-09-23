import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { Product, Category } from '@/types/domain'

export interface ProductFormValues {
  name: string
  barcode: string
  brand: string
  category_id: string
  cost_price: string
  sale_price: string
  stock_quantity: string
  min_stock: string
}

const EMPTY_FORM: ProductFormValues = {
  name: '',
  barcode: '',
  brand: '',
  category_id: '',
  cost_price: '',
  sale_price: '',
  stock_quantity: '0',
  min_stock: '0',
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ProductFormValues) => Promise<void>
  categories: Category[]
  product?: Product | null
}

export function ProductFormModal({ open, onClose, onSubmit, categories, product }: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (product) {
      setValues({
        name: product.name,
        barcode: product.barcode ?? '',
        brand: product.brand ?? '',
        category_id: product.category_id ?? '',
        cost_price: String(product.cost_price),
        sale_price: String(product.sale_price),
        stock_quantity: String(product.stock_quantity),
        min_stock: String(product.min_stock),
      })
    } else {
      setValues(EMPTY_FORM)
    }
    setError(null)
  }, [open, product])

  const margin =
    Number(values.sale_price) > 0 && Number(values.cost_price) >= 0
      ? (((Number(values.sale_price) - Number(values.cost_price)) / Number(values.sale_price)) * 100).toFixed(1)
      : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.name.trim()) {
      setError('Informe o nome do produto')
      return
    }
    if (Number(values.cost_price) < 0 || Number(values.sale_price) < 0) {
      setError('Preços não podem ser negativos')
      return
    }
    if (Number(values.sale_price) < Number(values.cost_price)) {
      setError('Atenção: preço de venda é menor que o custo')
    }

    setSubmitting(true)
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar produto' : 'Novo produto'}
      description={product ? undefined : 'Cadastre um novo item no catálogo'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {product ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-950 dark:text-danger-300">
            {error}
          </p>
        )}

        <Input
          label="Nome do produto"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="Ex: Pod Descartável 5000 puffs"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Marca"
            value={values.brand}
            onChange={(e) => setValues((v) => ({ ...v, brand: e.target.value }))}
          />
          <Input
            label="Código de barras"
            hint="Opcional"
            value={values.barcode}
            onChange={(e) => setValues((v) => ({ ...v, barcode: e.target.value }))}
          />
        </div>

        <Select
          label="Categoria"
          value={values.category_id}
          onChange={(e) => setValues((v) => ({ ...v, category_id: e.target.value }))}
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Custo de aquisição"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.cost_price}
            onChange={(e) => setValues((v) => ({ ...v, cost_price: e.target.value }))}
          />
          <Input
            label="Preço de venda"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.sale_price}
            onChange={(e) => setValues((v) => ({ ...v, sale_price: e.target.value }))}
          />
        </div>

        {margin !== null && (
          <p className="text-xs text-slate-500 dark:text-ink-400">
            Margem estimada: <span className="font-semibold text-slate-700 dark:text-ink-300">{margin}%</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Estoque atual"
            type="number"
            min="0"
            step="1"
            required
            value={values.stock_quantity}
            onChange={(e) => setValues((v) => ({ ...v, stock_quantity: e.target.value }))}
            disabled={!!product}
            hint={product ? 'Use Movimentações de estoque para ajustar' : undefined}
          />
          <Input
            label="Estoque mínimo"
            type="number"
            min="0"
            step="1"
            required
            value={values.min_stock}
            onChange={(e) => setValues((v) => ({ ...v, min_stock: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  )
}
