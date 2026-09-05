// Date maths for counting days on the island of Ireland.

export const DAY_MS = 86_400_000

export function toDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(toDate(iso).getTime() + days * DAY_MS))
}

export function addYears(iso: string, years: number): string {
  const d = toDate(iso)
  const out = new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate()))
  return toISO(out)
}

/** Whole days between two dates. Counts the start day, not the end day. */
export function daysBetween(startISO: string, endISO: string): number {
  return Math.round((toDate(endISO).getTime() - toDate(startISO).getTime()) / DAY_MS)
}

export function isBefore(a: string, b: string) {
  return toDate(a).getTime() < toDate(b).getTime()
}
export function isAfter(a: string, b: string) {
  return toDate(a).getTime() > toDate(b).getTime()
}

/** Days of an absence that fall inside a window. Travel days are treated as present. */
export function absenceDaysInWindow(
  departure: string,
  ret: string,
  windowStart: string,
  windowEnd: string,
): number {
  const start = Math.max(toDate(departure).getTime(), toDate(windowStart).getTime())
  const end = Math.min(toDate(ret).getTime(), toDate(windowEnd).getTime())
  if (end <= start) return 0
  // Full days away = days between departure and return, minus the two travel days.
  const raw = Math.round((end - start) / DAY_MS)
  return Math.max(0, raw - 1)
}

export function formatUK(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatLong(iso: string): string {
  if (!iso) return ''
  return toDate(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

/** Overlap in days between two periods. */
export function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = Math.max(toDate(aStart).getTime(), toDate(bStart).getTime())
  const end = Math.min(toDate(aEnd).getTime(), toDate(bEnd).getTime())
  return end <= start ? 0 : Math.round((end - start) / DAY_MS)
}
