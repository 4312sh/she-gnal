import { MONTHS, type TargetTime } from '../../game/eras'

export type FieldKey = 'month' | 'day' | 'year' | 'hour' | 'minute'

export const FIELDS: {
  key: FieldKey
  label: string
  ghost: string
  x: number
  w: number
  labelX: number
  max: number
}[] = [
  {
    key: 'month',
    label: 'MONTH',
    ghost: '000',
    x: 78,
    w: 275,
    labelX: 118,
    max: 2,
  },
  {
    key: 'day',
    label: 'DAY',
    ghost: '00',
    x: 376,
    w: 275,
    labelX: 416,
    max: 2,
  },
  {
    key: 'year',
    label: 'YEAR',
    ghost: '0000',
    x: 675,
    w: 422,
    labelX: 777,
    max: 4,
  },
  {
    key: 'hour',
    label: 'HOUR',
    ghost: '00',
    x: 1267,
    w: 275,
    labelX: 1307,
    max: 2,
  },
  {
    key: 'minute',
    label: 'MIN',
    ghost: '00',
    x: 1565,
    w: 275,
    labelX: 1605,
    max: 2,
  },
]

/** What a 14-segment display shows for a raw digit string. */
export function segText(key: FieldKey, raw: string) {
  if (!raw) return ''
  if (key === 'month') {
    const m = Number(raw)
    return raw.length === 2 && m >= 1 && m <= 12 ? MONTHS[m - 1] : raw.padStart(3, ' ')
  }
  return raw
}

export function rawFromTarget(t?: TargetTime): Record<FieldKey, string> {
  if (!t) return { month: '', day: '', year: '', hour: '', minute: '' }
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return {
    month: p(t.month),
    day: p(t.day),
    year: p(t.year, 4),
    hour: p(t.hour),
    minute: p(t.minute),
  }
}
