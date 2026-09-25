import { cn } from '@/lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Tabacaria Mata Jega"
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
