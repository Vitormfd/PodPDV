export const PAYMENT_METHODS = ['dinheiro', 'pix', 'debito', 'credito', 'fiado'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const RECEIVABLE_PAYMENT_METHODS = ['dinheiro', 'pix', 'debito', 'credito'] as const
export type ReceivablePaymentMethod = (typeof RECEIVABLE_PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  debito: 'Cartão de débito',
  credito: 'Cartão de crédito',
  fiado: 'Fiado',
}

export const MOVEMENT_TYPES = [
  'compra',
  'ajuste_entrada',
  'devolucao',
  'venda',
  'perda',
  'dano',
  'ajuste_saida',
] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  compra: 'Compra de mercadoria',
  ajuste_entrada: 'Ajuste de estoque (entrada)',
  devolucao: 'Devolução recebida',
  venda: 'Venda',
  perda: 'Perda',
  dano: 'Produto danificado',
  ajuste_saida: 'Ajuste de estoque (saída)',
}

export const MANUAL_MOVEMENT_TYPES = [
  'compra',
  'ajuste_entrada',
  'devolucao',
  'perda',
  'dano',
  'ajuste_saida',
] as const satisfies readonly MovementType[]

export const MOVEMENT_DIRECTION: Record<MovementType, 'in' | 'out'> = {
  compra: 'in',
  ajuste_entrada: 'in',
  devolucao: 'in',
  venda: 'out',
  perda: 'out',
  dano: 'out',
  ajuste_saida: 'out',
}

export const ROLES = ['owner', 'manager', 'cashier'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  cashier: 'Operador de caixa',
}

export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  open: 'Em aberto',
  partially_paid: 'Parcialmente pago',
  paid: 'Quitado',
}

export const CASH_REGISTER_STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  closed: 'Fechado',
}
