// Builds the two downloads, on this device only:
// a zip of every file sorted into section folders, and one printable PDF.
import { zipSync, strToU8, type Zippable } from 'fflate'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Assessment, Profile, StoredDocument } from './types'
import { contentsText, planExport, shortDate, type PlannedSection } from './exportPlan'
import { loadFile } from './storage'
import { toISO } from './dates'

type Progress = (done: number, total: number, label: string) => void

export async function buildZip(
  assessment: Assessment, profile: Profile, documents: StoredDocument[], onProgress?: Progress,
): Promise<Blob> {
  const sections = planExport(assessment, documents)
  const today = toISO(new Date())
  const tree: Zippable = {
    '00 What is in this pack.txt': strToU8(contentsText(sections, profile.applicantFullName, assessment.applicationDate, today)),
  }
  const all = sections.flatMap((s) => s.files)
  let done = 0
  for (const f of all) {
    onProgress?.(done, all.length, `Adding ${f.fileName}`)
    const blob = await loadFile(f.docId)
    if (blob) {
      // Scans and PDFs are already compressed, so store them as they are. It is much faster.
      tree[`${f.folder}/${f.fileName}`] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }]
    }
    done++
  }
  // Keep empty section folders, so the pack shows what is still missing.
  for (const s of sections) {
    if (s.files.length === 0) tree[`${s.folder}/`] = new Uint8Array(0)
  }
  onProgress?.(all.length, all.length, 'Packing the zip')
  const bytes = zipSync(tree)
  return new Blob([bytes as BlobPart], { type: 'application/zip' })
}

// ---------- The printable pack ----------

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 56
const GREEN = rgb(0.06, 0.49, 0.31)
const INK = rgb(0.07, 0.09, 0.15)
const GREY = rgb(0.29, 0.33, 0.39)
const RED = rgb(0.75, 0.1, 0.2)
const AMBER = rgb(0.7, 0.45, 0.05)

const STATE_WORDS: Record<string, string> = { pass: 'Complete', fail: 'Not complete', unknown: 'Needs a look' }
const STATE_COLOUR: Record<string, ReturnType<typeof rgb>> = { pass: GREEN, fail: RED, unknown: AMBER }

/** The built-in PDF fonts only know basic Western letters. Swap anything else for a close match. */
function pdfSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[→]/g, '->')
    .replace(/[•·]/g, '-')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '?')
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = pdfSafe(text).split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

class Writer {
  page!: PDFPage
  y = 0
  constructor(private pdf: PDFDocument, private font: PDFFont, private bold: PDFFont) {}

  newPage() {
    this.page = this.pdf.addPage(A4)
    this.y = A4[1] - MARGIN
  }

  text(t: string, opts: { size?: number; bold?: boolean; colour?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) {
    const size = opts.size ?? 11
    const font = opts.bold ? this.bold : this.font
    const indent = opts.indent ?? 0
    for (const line of wrap(t, font, size, A4[0] - MARGIN * 2 - indent)) {
      if (this.y < MARGIN + size) this.newPage()
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color: opts.colour ?? INK })
      this.y -= size * 1.4
    }
    this.y -= opts.gap ?? 4
  }

  rule() {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y }, end: { x: A4[0] - MARGIN, y: this.y },
      thickness: 1, color: rgb(0.85, 0.87, 0.9),
    })
    this.y -= 14
  }
}

export async function buildPrintablePdf(
  assessment: Assessment, profile: Profile, documents: StoredDocument[], onProgress?: Progress,
): Promise<{ blob: Blob; skipped: string[] }> {
  const sections = planExport(assessment, documents)
  const pdf = await PDFDocument.create()
  pdf.setTitle('Irish citizenship document pack')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const w = new Writer(pdf, font, bold)
  const skipped: string[] = []

  // Cover page and contents.
  w.newPage()
  w.text('Irish citizenship', { size: 13, colour: GREEN, bold: true, gap: 2 })
  w.text('Document pack', { size: 26, bold: true, gap: 10 })
  if (profile.applicantFullName) w.text(`Applicant: ${profile.applicantFullName}`, { size: 12 })
  if (profile.spouseFullName) w.text(`Irish partner: ${profile.spouseFullName}`, { size: 12 })
  w.text(`Checked against an application date of ${shortDate(assessment.applicationDate)}`, { size: 12 })
  w.text(`Printed from your tracker on ${shortDate(toISO(new Date()))}`, { size: 12, colour: GREY, gap: 14 })
  w.rule()
  w.text('What is in this pack', { size: 15, bold: true, gap: 8 })
  for (const s of sections) {
    w.text(`${s.number}. ${s.title}`, { size: 12, bold: true, gap: 0 })
    w.text(`${STATE_WORDS[s.state] ?? s.state}. ${s.files.length} document${s.files.length === 1 ? '' : 's'}.`,
      { size: 10, colour: STATE_COLOUR[s.state] ?? GREY, indent: 14, gap: 8 })
  }
  w.rule()
  w.text('This pack is for printing and for your own records. When you apply online, upload each file on its own, in its own section. Do not merge files, and do not upload the same file to two years.',
    { size: 10, colour: GREY })

  const all = sections.flatMap((s) => s.files)
  let done = 0

  for (const s of sections) {
    divider(w, s)
    for (const f of s.files) {
      onProgress?.(done, all.length, `Adding ${f.fileName}`)
      const doc = documents.find((d) => d.id === f.docId)
      const blob = await loadFile(f.docId)
      const added = blob && doc ? await appendDocument(pdf, blob, doc, f.label, font) : false
      if (!added) {
        skipped.push(f.fileName)
        w.newPage()
        w.text(f.label, { size: 14, bold: true })
        w.text(`${f.fileName} could not be added to this pack. Print it on its own from the zip download.`, { colour: RED })
      }
      done++
    }
  }

  onProgress?.(all.length, all.length, 'Saving the PDF')
  const bytes = await pdf.save()
  return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), skipped }
}

function divider(w: Writer, s: PlannedSection) {
  w.newPage()
  w.text(`Section ${s.number}`, { size: 13, bold: true, colour: GREEN, gap: 2 })
  w.text(s.title, { size: 24, bold: true, gap: 8 })
  w.text(`${STATE_WORDS[s.state] ?? s.state}. ${s.message}`, { size: 12, colour: STATE_COLOUR[s.state] ?? GREY, gap: 12 })
  w.rule()
  if (s.files.length === 0) {
    w.text('Nothing uploaded in this section yet.', { size: 12, colour: GREY })
    return
  }
  w.text('Documents in this section', { size: 13, bold: true, gap: 6 })
  for (const f of s.files) {
    w.text(f.label, { size: 11, bold: true, gap: 0 })
    w.text(f.fileName, { size: 10, colour: GREY, indent: 14, gap: 8 })
  }
}

/** Adds a document's pages. PDFs are copied page by page. Photos go one per page, scaled to fit. */
async function appendDocument(
  pdf: PDFDocument, blob: Blob, doc: StoredDocument, label: string, font: PDFFont,
): Promise<boolean> {
  const isPdf = blob.type === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf')
  try {
    if (isPdf) {
      const src = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true })
      const pages = await pdf.copyPages(src, src.getPageIndices())
      pages.forEach((p) => pdf.addPage(p))
      return pages.length > 0
    }
    if (blob.type.startsWith('image/') || /\.(png|jpe?g|heic|webp|gif)$/i.test(doc.fileName)) {
      const png = await toPngBytes(blob)
      const img = await pdf.embedPng(png)
      const page = pdf.addPage(A4)
      const footer = 28
      const maxW = A4[0] - MARGIN * 2
      const maxH = A4[1] - MARGIN * 2 - footer
      const scale = Math.min(maxW / img.width, maxH / img.height, 1.5)
      const dw = img.width * scale
      const dh = img.height * scale
      page.drawImage(img, { x: (A4[0] - dw) / 2, y: MARGIN + footer + (maxH - dh) / 2, width: dw, height: dh })
      page.drawText(pdfSafe(`${label} - ${doc.fileName}`).slice(0, 110), {
        x: MARGIN, y: MARGIN, size: 9, font, color: GREY,
      })
      return true
    }
  } catch (err) {
    console.error('Could not add to the printable pack', doc.fileName, err)
  }
  return false
}

/** Any photo the browser can show, turned into PNG so the PDF can hold it. */
async function toPngBytes(blob: Blob): Promise<Uint8Array> {
  if (blob.type === 'image/png') return new Uint8Array(await blob.arrayBuffer())
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  const png: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No PNG'))), 'image/png'))
  return new Uint8Array(await png.arrayBuffer())
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
