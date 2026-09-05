// Pulls text out of an uploaded file, on this device only.
// PDFs with a text layer are read directly. Scans and photos go through OCR
// (optical character recognition: a computer reading letters in a picture).
import * as pdfjs from 'pdfjs-dist'
import PdfWorker from './pdf-worker?worker'
import { installPdfPolyfills } from './pdf-polyfills'

installPdfPolyfills()
pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

export interface ExtractResult {
  text: string
  confidence: number | null
  method: 'pdf-text' | 'ocr' | 'none'
}

const MAX_OCR_PAGES = 3

export async function extractText(
  file: Blob,
  fileName: string,
  onProgress?: (pct: number, label: string) => void,
): Promise<ExtractResult> {
  const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  if (isPdf) {
    const fromLayer = await readPdfTextLayer(file, onProgress)
    if (fromLayer.trim().length > 60) {
      return { text: fromLayer, confidence: 100, method: 'pdf-text' }
    }
    const images = await renderPdfPages(file, MAX_OCR_PAGES, onProgress)
    if (!images.length) return { text: fromLayer, confidence: null, method: 'none' }
    const ocr = await runOcr(images, onProgress)
    return { text: `${fromLayer}\n${ocr.text}`.trim(), confidence: ocr.confidence, method: 'ocr' }
  }

  if (file.type.startsWith('image/')) {
    const ocr = await runOcr([file], onProgress)
    return { text: ocr.text, confidence: ocr.confidence, method: 'ocr' }
  }

  return { text: '', confidence: null, method: 'none' }
}

async function readPdfTextLayer(file: Blob, onProgress?: (p: number, l: string) => void) {
  try {
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const pages: string[] = []
    const total = Math.min(doc.numPages, 12)
    for (let i = 1; i <= total; i++) {
      onProgress?.(Math.round((i / total) * 40), `Reading page ${i} of ${total}`)
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
    }
    return pages.join('\n')
  } catch {
    return ''
  }
}

async function renderPdfPages(file: Blob, maxPages: number, onProgress?: (p: number, l: string) => void) {
  try {
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const out: Blob[] = []
    const total = Math.min(doc.numPages, maxPages)
    for (let i = 1; i <= total; i++) {
      onProgress?.(40 + Math.round((i / total) * 10), `Preparing page ${i} for scanning`)
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      await page.render({ canvas, canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
      if (blob) out.push(blob)
    }
    return out
  } catch (err) {
    console.error('Could not turn the PDF into pictures for scanning', err)
    return []
  }
}

// The OCR engine is served from this app, not from a content delivery network,
// so no part of a document ever leaves the device and the app works offline.
const OCR_PATHS = {
  workerPath: `${import.meta.env.BASE_URL}tesseract/worker.min.js`,
  corePath: `${import.meta.env.BASE_URL}tesseract`,
  langPath: `${import.meta.env.BASE_URL}tesseract`,
  gzip: true,
}

async function runOcr(images: Blob[], onProgress?: (p: number, l: string) => void) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, OCR_PATHS)
  try {
    const texts: string[] = []
    let confSum = 0
    for (let i = 0; i < images.length; i++) {
      onProgress?.(50 + Math.round(((i + 1) / images.length) * 45), `Scanning image ${i + 1} of ${images.length}`)
      const { data } = await worker.recognize(images[i])
      texts.push(data.text)
      confSum += data.confidence ?? 0
    }
    return { text: texts.join('\n'), confidence: Math.round(confSum / images.length) }
  } finally {
    await worker.terminate()
  }
}
