import type { Database } from './database.types'

export type Product = Database['public']['Tables']['products']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type SaleItem = Database['public']['Tables']['sale_items']['Row']
export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row']
export type Receivable = Database['public']['Tables']['receivables']['Row']
export type ReceivablePayment = Database['public']['Tables']['receivable_payments']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface CartItem {
  product: Product
  quantity: number
  discount: number
}

export interface DashboardSummary {
  revenue: number
  profit: number
  sales_count: number
  discounts_given: number
  open_receivables_total: number
  debtor_count: number
  low_stock_count: number
  by_payment_method: Record<string, number>
}

export interface BestSeller {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface ProfitReportRow {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
  cost: number
  profit: number
}

export type DateRangePreset = 'today' | '7d' | 'month' | 'custom'
