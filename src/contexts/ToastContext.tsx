import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success-200 bg-white text-slate-800 dark:border-success-800 dark:bg-ink-900 dark:text-ink-100',
  error: 'border-danger-200 bg-white text-slate-800 dark:border-danger-800 dark:bg-ink-900 dark:text-ink-100',
  info: 'border-slate-200 bg-white text-slate-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100',
}

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-success-500',
  error: 'text-danger-500',
  info: 'text-accent-500',
}

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, variant, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => {
          const Icon = VARIANT_ICONS[toast.variant]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-bottom-2 dark:shadow-black/30 ${VARIANT_STYLES[toast.variant]}`}
            >
              <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${ICON_STYLES[toast.variant]}`} strokeWidth={2} />
              <p className="flex-1 text-[13px] font-medium leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-ink-500 dark:hover:text-ink-200"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
