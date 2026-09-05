// The pdf.js worker, wrapped so the browser stand-ins are in place before it starts.
import { installPdfPolyfills } from './pdf-polyfills'

installPdfPolyfills()
await import('pdfjs-dist/build/pdf.worker.min.mjs')
