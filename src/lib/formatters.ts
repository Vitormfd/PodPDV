const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? Number(value) : (value ?? 0)
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return value
}

export function maskCpf(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`
}

export function toDateRangeIso(from: Date, to: Date): { from: string; to: string } {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}
