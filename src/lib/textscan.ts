// Small helpers that look for useful things inside the text of a document.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

export interface FoundDate {
  iso: string
  raw: string
}

/** Finds dates written in the common UK and Irish ways. */
export function findDates(text: string): FoundDate[] {
  const out: FoundDate[] = []
  const push = (y: number, m: number, d: number, raw: string) => {
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return
    out.push({ iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, raw })
  }

  // 12/03/2024, 12-03-2024, 12.03.2024  (day first, the UK and Irish way)
  for (const m of text.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g)) {
    let y = Number(m[3])
    if (y < 100) y += y > 50 ? 1900 : 2000
    push(y, Number(m[2]), Number(m[1]), m[0])
  }
  // 2024-03-12
  for (const m of text.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    push(Number(m[1]), Number(m[2]), Number(m[3]), m[0])
  }
  // 12 March 2024 / 12 Mar 2024
  for (const m of text.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/g)) {
    const mm = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mm) push(Number(m[3]), mm, Number(m[1]), m[0])
  }
  // March 12, 2024
  for (const m of text.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/g)) {
    const mm = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (mm) push(Number(m[3]), mm, Number(m[2]), m[0])
  }
  // "March 2024" with no day: treat as the first of that month
  for (const m of text.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{4})\b/g)) {
    const mm = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (mm) push(Number(m[2]), mm, 1, m[0])
  }

  const seen = new Set<string>()
  return out.filter((d) => (seen.has(d.iso) ? false : (seen.add(d.iso), true)))
}

const NI_POSTCODE = /\bBT\s?\d{1,2}\s?\d[A-Z]{2}\b/i
const IE_EIRCODE = /\b[AC-FHKNPRTV-Y]\d{2}\s?[0-9AC-FHKNPRTV-Y]{4}\b/i

export function hasNorthernIrelandPostcode(text: string) {
  return NI_POSTCODE.test(text)
}
export function hasIrishEircode(text: string) {
  return IE_EIRCODE.test(text)
}
export function hasIslandOfIrelandAddress(text: string) {
  return hasNorthernIrelandPostcode(text) || hasIrishEircode(text)
}

export function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when most parts of the person's name show up in the document text. */
export function containsPersonName(text: string, fullName: string) {
  const parts = normalise(fullName).split(' ').filter((p) => p.length > 1)
  if (!parts.length) return false
  const hay = normalise(text)
  const hits = parts.filter((p) => hay.includes(p)).length
  return hits >= Math.max(2, Math.ceil(parts.length * 0.6)) || (parts.length === 1 && hits === 1)
}

/** True when enough words of the saved address show up in the document text. */
export function containsAddress(text: string, address: string) {
  const parts = normalise(address).split(' ').filter((p) => p.length > 2)
  if (parts.length < 2) return false
  const hay = normalise(text)
  const hits = parts.filter((p) => hay.includes(p)).length
  return hits >= Math.max(2, Math.ceil(parts.length * 0.5))
}

export function containsAnyKeyword(text: string, keywords: string[]) {
  const hay = normalise(text)
  return keywords.some((k) => hay.includes(normalise(k)))
}
