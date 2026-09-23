import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { Customer } from '@/types/domain'

export interface CustomerFormValues {
  name: string
  phone: string
  cpf: string
  notes: string
}

const EMPTY_FORM: CustomerFormValues = { name: '', phone: '', cpf: '', notes: '' }

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: CustomerFormValues) => Promise<void>
  customer?: Customer | null
}

export function CustomerFormModal({ open, onClose, onSubmit, customer }: CustomerFormModalProps) {
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(
      customer
        ? { name: customer.name, phone: customer.phone ?? '', cpf: customer.cpf ?? '', notes: customer.notes ?? '' }
        : EMPTY_FORM
    )
    setError(null)
  }, [open, customer])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!values.name.trim()) {
      setError('Informe o nome do cliente')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? 'Editar cliente' : 'Novo cliente'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {customer ? 'Salvar' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        <Input
          label="Nome"
          required
          autoFocus
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
        <Input
          label="Telefone"
          hint="Opcional"
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          placeholder="(11) 99999-9999"
        />
        <Input
          label="CPF"
          hint="Opcional — colete apenas se necessário"
          value={values.cpf}
          onChange={(e) => setValues((v) => ({ ...v, cpf: e.target.value }))}
        />
        <Textarea
          label="Observações"
          hint="Opcional"
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
        />
      </form>
    </Modal>
  )
}
