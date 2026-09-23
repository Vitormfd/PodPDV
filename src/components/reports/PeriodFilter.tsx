import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import type { DateRangePreset } from '@/types/domain'

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
]

interface PeriodFilterProps {
  preset: DateRangePreset
  onPresetChange: (preset: DateRangePreset) => void
  customFrom: string
  onCustomFromChange: (value: string) => void
  customTo: string
  onCustomToChange: (value: string) => void
}

export function PeriodFilter({ preset, onPresetChange, customFrom, onCustomFromChange, customTo, onCustomToChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-ink-800 dark:bg-ink-950/60">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPresetChange(p.value)}
            className={cn(
              'rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              preset === p.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50'
                : 'text-slate-500 hover:text-slate-700 dark:text-ink-400 dark:hover:text-ink-100'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="w-40" />
          <span className="text-slate-400 dark:text-ink-500">até</span>
          <Input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="w-40" />
        </div>
      )}
    </div>
  )
}
