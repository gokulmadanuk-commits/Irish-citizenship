// Works out where every uploaded document goes in the download.
// Pure logic, no browser needed, so it can be tested.
import type { Assessment, StoredDocument } from './types'
import { DOCUMENT_SECTIONS, sectionIdForDocType } from '../rules/sections'
import { docTypeById } from '../rules/documents'
import { toDate } from './dates'
import { assignYear } from '../rules/engine'

export interface PlannedFile {
  docId: string
  sectionId: string
  /** Folder path inside the zip, for example "01 Proof you lived here/Year 1 (...)". */
  folder: string
  /** Clean file name inside that folder. */
  fileName: string
  /** Short heading used on the printed pack. */
  label: string
  /** The residence year this document is filed under, if any. */
  yearIndex: number | null
}

export interface PlannedSection {
  sectionId: string
  number: number
  title: string
  folder: string
  state: string
  message: string
  files: PlannedFile[]
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function shortDate(iso: string): string {
  const d = toDate(iso)
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Removes characters that Windows, Mac or a zip file cannot hold in a name. */
export function safeName(name: string): string {
  return name
    .replace(/\s*:\s+/g, ' - ')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'document'
}

function splitExt(fileName: string): [string, string] {
  const i = fileName.lastIndexOf('.')
  if (i <= 0 || i < fileName.length - 6) return [fileName, '']
  return [fileName.slice(0, i), fileName.slice(i)]
}

/** The document type name without the points note in brackets. */
function shortTypeName(docTypeId: string): string {
  const name = docTypeById(docTypeId)?.name ?? docTypeId
  return name.replace(/\s*\([^)]*points\)\s*$/i, '').trim()
}

/** The residence year a document is filed under. Same rule the scores use. */
export function yearForDocument(doc: StoredDocument, assessment: Assessment): number | null {
  return assignYear(doc, assessment.years)
}

export function planExport(assessment: Assessment, documents: StoredDocument[]): PlannedSection[] {
  return DOCUMENT_SECTIONS.map((section, i) => {
    const number = i + 1
    const folder = `${String(number).padStart(2, '0')} ${safeName(section.title)}`
    const status = assessment.sections.find((s) => s.id === section.id)
    const yearOf = (d: StoredDocument) =>
      section.kind === 'per-year' ? (yearForDocument(d, assessment) ?? Number.MAX_SAFE_INTEGER) : 0
    const own = documents
      .filter((d) => sectionIdForDocType(d.docTypeId) === section.id)
      .sort((a, b) => yearOf(a) - yearOf(b)
        || (a.coversFrom || a.uploadedAt).localeCompare(b.coversFrom || b.uploadedAt))

    const used = new Map<string, number>()
    const files: PlannedFile[] = own.map((doc) => {
      let sub = folder
      let yearIndex: number | null = null
      if (section.kind === 'per-year') {
        yearIndex = yearForDocument(doc, assessment)
        const year = yearIndex ? assessment.years[yearIndex - 1] : null
        sub = year
          ? `${folder}/Year ${year.index} (${shortDate(year.start)} to ${shortDate(year.end)})`
          : `${folder}/Not matched to a year yet`
      }
      const [base, ext] = splitExt(doc.fileName)
      const stem = safeName(`${shortTypeName(doc.docTypeId)} - ${base}`)
      const key = `${sub}/${stem}${ext}`.toLowerCase()
      const n = (used.get(key) ?? 0) + 1
      used.set(key, n)
      const fileName = n === 1 ? `${stem}${ext}` : `${stem} (${n})${ext}`
      return {
        docId: doc.id,
        sectionId: section.id,
        folder: sub,
        fileName,
        label: yearIndex ? `Year ${yearIndex} · ${shortTypeName(doc.docTypeId)}` : shortTypeName(doc.docTypeId),
        yearIndex,
      }
    })

    return {
      sectionId: section.id,
      number,
      title: section.title,
      folder,
      state: status?.state ?? 'unknown',
      message: status?.message ?? '',
      files,
    }
  })
}

const STATE_WORDS: Record<string, string> = { pass: 'Complete', fail: 'Not complete', unknown: 'Needs a look' }

/** A plain text contents page that goes at the top of the zip. */
export function contentsText(
  sections: PlannedSection[], applicantName: string, applicationDate: string, madeOn: string,
): string {
  const lines: string[] = []
  lines.push('IRISH CITIZENSHIP APPLICATION: DOCUMENT PACK')
  lines.push('')
  if (applicantName) lines.push(`Applicant: ${applicantName}`)
  lines.push(`Checked against an application date of ${shortDate(applicationDate)}`)
  lines.push(`Made on ${shortDate(madeOn)}`)
  lines.push('')
  lines.push('Every file is in the folder for its section. Proof of residence is filed under one year each.')
  lines.push('When you upload to the online portal, upload each file on its own, in its own section.')
  lines.push('Do not merge files, and do not upload the same file to two years.')
  lines.push('')
  for (const s of sections) {
    lines.push(`${String(s.number).padStart(2, '0')}  ${s.title.toUpperCase()}   [${STATE_WORDS[s.state] ?? s.state}]`)
    if (s.message) lines.push(`    ${s.message}`)
    if (s.files.length === 0) lines.push('    (nothing uploaded yet)')
    for (const f of s.files) {
      const inside = f.folder === s.folder ? '' : `${f.folder.slice(s.folder.length + 1)}/`
      lines.push(`    - ${inside}${f.fileName}`)
    }
    lines.push('')
  }
  lines.push('This pack was made on your own computer. Nothing was sent anywhere.')
  return lines.join('\r\n')
}
