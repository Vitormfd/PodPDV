import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-t-xl border border-slate-200 bg-white shadow-2xl shadow-black/10 animate-in slide-in-from-bottom duration-200 sm:rounded-xl sm:animate-in sm:fade-in sm:zoom-in-95 dark:border-ink-700 dark:bg-ink-900 dark:shadow-black/40',
          SIZE_CLASSES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-ink-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-ink-50">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-slate-500 dark:text-ink-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            aria-label="Fechar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 dark:border-ink-800 dark:bg-ink-950/40">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
