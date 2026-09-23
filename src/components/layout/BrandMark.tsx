import { cn } from '@/lib/cn'

/**
 * Marca própria do Vape PDV: uma gota (e-liquido) com um traço interno
 * sugerindo vapor/brilho. Deliberadamente não usa um ícone genérico de
 * biblioteca para o mark principal da marca.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-md bg-accent-500 text-ink-950', className)}>
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        <path
          d="M12 2.8c3.6 4.1 6.3 7.6 6.3 10.7a6.3 6.3 0 1 1-12.6 0c0-3.1 2.7-6.6 6.3-10.7Z"
          fill="currentColor"
        />
        <path
          d="M9.3 14.6c0 1.7 1.2 2.9 2.9 2.9"
          stroke="var(--color-accent-500)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>
  )
}
