// Tipos manuais espelhando supabase/migrations/*.sql.
// Assim que o projeto Supabase existir, substitua por:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['stores']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['stores']['Row']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          store_id: string
          full_name: string
          role: 'owner' | 'manager' | 'cashier'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string
          store_id: string
          full_name: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          store_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          store_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          name: string
          barcode: string | null
          brand: string | null
          cost_price: number
          sale_price: number
          stock_quantity: number
          min_stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          store_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['products']['Row']>
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          store_id: string
          name: string
          phone: string | null
          cpf: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['customers']['Row']> & {
          store_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['customers']['Row']>
        Relationships: []
      }
      cash_registers: {
        Row: {
          id: string
          store_id: string
          opened_by: string
          closed_by: string | null
          opening_balance: number
          opened_at: string
          closed_at: string | null
          status: 'open' | 'closed'
          expected_cash: number | null
          counted_cash: number | null
          difference: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['cash_registers']['Row']>
        Update: Partial<Database['public']['Tables']['cash_registers']['Row']>
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          store_id: string
          cash_register_id: string | null
          customer_id: string | null
          sold_by: string
          subtotal: number
          discount: number
          total: number
          payment_method: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'
          cash_received: number | null
          change_given: number | null
          status: 'completed' | 'cancelled'
          idempotency_key: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales']['Row']>
        Update: Partial<Database['public']['Tables']['sales']['Row']>
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          unit_cost: number
          discount: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['sale_items']['Row']>
        Update: Partial<Database['public']['Tables']['sale_items']['Row']>
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          store_id: string
          product_id: string
          movement_type:
            | 'compra'
            | 'ajuste_entrada'
            | 'devolucao'
            | 'venda'
            | 'perda'
            | 'dano'
            | 'ajuste_saida'
          direction: 'in' | 'out'
          quantity: number
          unit_cost: number | null
          reason: string | null
          reference_sale_id: string | null
          created_by: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['inventory_movements']['Row']>
        Update: Partial<Database['public']['Tables']['inventory_movements']['Row']>
        Relationships: []
      }
      receivables: {
        Row: {
          id: string
          store_id: string
          customer_id: string
          sale_id: string
          original_amount: number
          paid_amount: number
          remaining_amount: number
          status: 'open' | 'partially_paid' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['receivables']['Row']>
        Update: Partial<Database['public']['Tables']['receivables']['Row']>
        Relationships: []
      }
      receivable_payments: {
        Row: {
          id: string
          receivable_id: string
          amount: number
          payment_method: 'dinheiro' | 'pix' | 'debito' | 'credito'
          received_by: string
          cash_register_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['receivable_payments']['Row']>
        Update: Partial<Database['public']['Tables']['receivable_payments']['Row']>
        Relationships: []
      }
      cash_movements: {
        Row: {
          id: string
          store_id: string
          cash_register_id: string
          movement_type: 'sale' | 'receivable_payment' | 'manual_in' | 'manual_out'
          payment_method: 'dinheiro' | 'pix' | 'debito' | 'credito' | null
          direction: 'in' | 'out'
          amount: number
          reference_sale_id: string | null
          reference_receivable_payment_id: string | null
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['cash_movements']['Row']>
        Update: Partial<Database['public']['Tables']['cash_movements']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_sale: {
        Args: {
          p_customer_id: string | null
          p_items: Json
          p_discount: number
          p_payment_method: string
          p_cash_received: number | null
          p_idempotency_key: string
        }
        Returns: Database['public']['Tables']['sales']['Row']
      }
      register_inventory_movement: {
        Args: {
          p_product_id: string
          p_movement_type: string
          p_quantity: number
          p_unit_cost: number | null
          p_reason: string | null
        }
        Returns: Database['public']['Tables']['inventory_movements']['Row']
      }
      register_receivable_payment: {
        Args: {
          p_receivable_id: string
          p_amount: number
          p_payment_method: string
          p_notes: string | null
          p_allow_overpayment?: boolean
        }
        Returns: Database['public']['Tables']['receivable_payments']['Row']
      }
      get_dashboard_summary: {
        Args: { p_date_from: string; p_date_to: string }
        Returns: Json
      }
      get_best_sellers: {
        Args: { p_date_from: string; p_date_to: string; p_limit?: number }
        Returns: { product_id: string; product_name: string; quantity_sold: number; revenue: number }[]
      }
      get_low_stock_products: {
        Args: Record<string, never>
        Returns: { id: string; name: string; stock_quantity: number; min_stock: number }[]
      }
      get_profit_report: {
        Args: { p_date_from: string; p_date_to: string }
        Returns: {
          product_id: string
          product_name: string
          quantity_sold: number
          revenue: number
          cost: number
          profit: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
