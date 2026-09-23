import { useMemo, useState } from 'react'
import { toDateRangeIso } from '@/lib/formatters'
import type { DateRangePreset } from '@/types/domain'

export function useDateRange(initial: DateRangePreset = 'today') {
  const [preset, setPreset] = useState<DateRangePreset>(initial)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const range = useMemo(() => {
    const now = new Date()
    if (preset === 'today') {
      return toDateRangeIso(now, now)
    }
    if (preset === '7d') {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      return toDateRangeIso(from, now)
    }
    if (preset === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return toDateRangeIso(from, now)
    }
    if (customFrom && customTo) {
      return toDateRangeIso(new Date(customFrom), new Date(customTo))
    }
    return toDateRangeIso(now, now)
  }, [preset, customFrom, customTo])

  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range }
}
