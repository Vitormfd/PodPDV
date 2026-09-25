import { useCallback, useMemo, useState } from 'react'
import { ProductSearchPanel } from '@/components/pdv/ProductSearchPanel'
import { Cart } from '@/components/pdv/Cart'
import { PaymentModal } from '@/components/pdv/PaymentModal'
import { SaleConfirmation } from '@/components/pdv/SaleConfirmation'
import { CustomerFormModal, type CustomerFormValues } from '@/components/customers/CustomerFormModal'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useCustomers } from '@/hooks/useCustomers'
import { createSale } from '@/services/sales.service'
import { useToast } from '@/contexts/ToastContext'
import { newIdempotencyKey } from '@/lib/idempotency'
import type { CartItem, Product, Sale } from '@/types/domain'
import type { PaymentMethod } from '@/lib/constants'

const PRODUCT_FILTERS = { onlyActive: true }

export function PdvPage() {
  const { products, loading: productsLoading } = useProducts(PRODUCT_FILTERS)
  const { categories } = useCategories()
  const { customers, add: addCustomer, refresh: refreshCustomers } = useCustomers()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey())

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.sale_price * item.quantity - item.discount, 0),
    [cartItems]
  )
  const total = Math.max(0, subtotal - discount)

  function addToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { product, quantity: 1, discount: 0 }]
    })
  }

  function increment(productId: string) {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId && i.quantity < i.product.stock_quantity ? { ...i, quantity: i.quantity + 1 } : i))
    )
  }

  function decrement(productId: string) {
    setCartItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function removeItem(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const resetCart = useCallback(() => {
    setCartItems([])
    setDiscount(0)
    setIdempotencyKey(newIdempotencyKey())
  }, [])

  async function handleConfirmSale(input: { paymentMethod: PaymentMethod; customerId: string | null; cashReceived: number | null }) {
    const sale = await createSale({
      customerId: input.customerId,
      items: cartItems,
      discount,
      paymentMethod: input.paymentMethod,
      cashReceived: input.cashReceived,
      idempotencyKey,
    })
    setPaymentModalOpen(false)
    setCompletedSale(sale)
    resetCart()
  }

  async function handleAddCustomer(values: CustomerFormValues) {
    await addCustomer({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      cpf: values.cpf.trim() || null,
      notes: values.notes.trim() || null,
    })
    await refreshCustomers()
    showToast('Cliente cadastrado', 'success')
  }

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-3.5 md:h-[calc(100vh-4rem)] lg:grid-cols-[1fr_360px]">
      <div className="min-h-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <ProductSearchPanel products={products} categories={categories} loading={productsLoading} onAdd={addToCart} />
      </div>
      <div className="min-h-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <Cart
          items={cartItems}
          onIncrement={increment}
          onDecrement={decrement}
          onRemove={removeItem}
          discount={discount}
          onDiscountChange={setDiscount}
          subtotal={subtotal}
          total={total}
          onCheckout={() => setPaymentModalOpen(true)}
        />
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={total}
        customers={customers}
        onConfirm={handleConfirmSale}
        onRequestNewCustomer={() => setCustomerModalOpen(true)}
      />
      <CustomerFormModal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onSubmit={handleAddCustomer} />
      <SaleConfirmation sale={completedSale} onClose={() => setCompletedSale(null)} />
    </div>
  )
}
