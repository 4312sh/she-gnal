/**
 * Eras the player can tune into. The date entered on the time-setup screen is
 * matched to the era whose anchor year is closest.
 * NOTE: present / future anchors, cities and coordinates are placeholders until
 * the story team fixes them.
 */
export type Era = {
  id: 'past' | 'present' | 'future'
  anchorYear: number
  city: string
  character: string
  coordinates: string
  layer: string
  orbit: number
}

export const ERAS: Era[] = [
  {
    id: 'past',
    anchorYear: 1935,
    city: 'GYEONGSEONG',
    character: '나혜석',
    coordinates: '37.5°N / 126.9°E',
    layer: 'ERA-1930s',
    orbit: 7,
  },
  {
    id: 'present',
    anchorYear: 2026,
    city: 'SEOUL',
    character: '하리나',
    coordinates: '37.5°N / 127.0°E',
    layer: 'ERA-2020s',
    orbit: 4,
  },
  {
    id: 'future',
    anchorYear: 2150,
    city: 'NEO-SEOUL',
    character: 'EIO',
    coordinates: '??.?°N / ???.?°E',
    layer: 'ERA-2150s',
    orbit: 1,
  },
]

export const TOTAL_ORBITS = 9

export function nearestEra(year: number): Era {
  return ERAS.reduce((best, e) => (Math.abs(e.anchorYear - year) < Math.abs(best.anchorYear - year) ? e : best))
}

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export type TargetTime = {
  year: number
  month: number // 1-12
  day: number
  hour: number // 1-12
  minute: number
  pm: boolean
}

export function toDate(t: TargetTime) {
  const h24 = (t.hour % 12) + (t.pm ? 12 : 0)
  const d = new Date(2000, t.month - 1, t.day, h24, t.minute)
  d.setFullYear(t.year) // keeps years < 100 exact
  return d
}

export function isValidTarget(t: Partial<TargetTime>): t is TargetTime {
  const { year, month, day, hour, minute } = t
  if (![year, month, day, hour, minute].every((v) => typeof v === 'number' && Number.isFinite(v))) return false
  if (year! < 1 || year! > 9999 || month! < 1 || month! > 12 || hour! < 1 || hour! > 12 || minute! > 59) return false
  const last = new Date(2000, month!, 0)
  last.setFullYear(year!, month!, 0)
  return day! >= 1 && day! <= last.getDate()
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

export function formatTarget(t: TargetTime) {
  return `${pad(t.year, 4)}.${pad(t.month)}.${pad(t.day)}  ${t.pm ? 'PM' : 'AM'} ${pad(t.hour)}:${pad(t.minute)}`
}

export function formatNow(d = new Date()) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function daysBetween(a: Date, b: Date) {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000)
}
