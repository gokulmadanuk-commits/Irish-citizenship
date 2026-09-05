import { useRef, useState } from 'react'
import type { Assessment, Profile, StoredDocument } from '../lib/types'
import { Button, Card, Empty, Field, StatePill, inputClass } from './ui'
import { DOCUMENT_TYPES, docTypeById } from '../rules/documents'
import { documentState, runChecks } from '../rules/checks'
import { extractText } from '../lib/extract'
import { saveFile, loadFile } from '../lib/storage'
import { formatLong, toISO } from '../lib/dates'

export function DocumentsPanel({ profile, documents, assessment, onUpsert, onRemove }: {
  profile: Profile
  documents: StoredDocument[]
  assessment: Assessment
  onUpsert: (d: StoredDocument) => void
  onRemove: (id: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [docTypeId, setDocTypeId] = useState(DOCUMENT_TYPES[0]?.docId ?? '')
  const [coversFrom, setCoversFrom] = useState('')
  const [coversTo, setCoversTo] = useState('')
  const [busy, setBusy] = useState<{ name: string; pct: number; label: string } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const selectedType = docTypeById(docTypeId)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      await saveFile(id, file)
      let doc: StoredDocument = {
        id,
        docTypeId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        coversFrom: selectedType?.isResidenceProof ? coversFrom : '',
        coversTo: selectedType?.isResidenceProof ? coversTo : '',
        ocrText: '',
        ocrState: 'running',
        ocrConfidence: null,
        checks: [],
        userConfirmed: false,
        notes: '',
      }
      onUpsert(doc)
      setBusy({ name: file.name, pct: 5, label: 'Opening the file' })
      try {
        const res = await extractText(file, file.name, (pct, label) => setBusy({ name: file.name, pct, label }))
        doc = {
          ...doc,
          ocrText: res.text,
          ocrConfidence: res.confidence,
          ocrState: res.method === 'none' ? 'skipped' : 'done',
        }
      } catch {
        doc = { ...doc, ocrState: 'failed' }
      }
      doc = { ...doc, checks: runChecks(doc, profile) }
      onUpsert(doc)
      setBusy(null)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const rerun = (doc: StoredDocument) => onUpsert({ ...doc, checks: runChecks(doc, profile) })

  return (
    <div className="grid gap-5">
      <Card title="Upload a document" subtitle="Photos and PDFs both work. Files never leave this device.">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
          <Field label="What is this document?">
            <select className={inputClass} value={docTypeId} onChange={(e) => setDocTypeId(e.target.value)}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.docId} value={t.docId}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Covers from" hint={selectedType?.isResidenceProof ? 'First date this proves' : 'Not needed'}>
            <input type="date" className={inputClass} disabled={!selectedType?.isResidenceProof}
              value={coversFrom} onChange={(e) => setCoversFrom(e.target.value)} />
          </Field>
          <Field label="Covers to" hint={selectedType?.isResidenceProof ? 'Last date this proves' : 'Not needed'}>
            <input type="date" className={inputClass} disabled={!selectedType?.isResidenceProof}
              value={coversTo} onChange={(e) => setCoversTo(e.target.value)} />
          </Field>
          <div className="pb-0.5">
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
              onChange={(e) => void handleFiles(e.target.files)} />
            <Button onClick={() => fileRef.current?.click()}>Choose files</Button>
          </div>
        </div>

        {selectedType && (
          <div className="mt-4 rounded-xl bg-ink-50 p-4">
            <p className="text-sm font-medium text-ink-900">{selectedType.name}</p>
            <p className="mt-1 text-sm text-ink-600">{selectedType.whyNeeded}</p>
            <ul className="mt-2 grid gap-1">
              {selectedType.acceptanceCriteria.map((c) => (
                <li key={c.id} className="text-xs text-ink-600">• {c.label}</li>
              ))}
            </ul>
          </div>
        )}

        {busy && (
          <div className="mt-4 rounded-xl bg-shamrock-50 p-4 ring-1 ring-shamrock-200">
            <p className="text-sm font-medium text-shamrock-800">Reading {busy.name}</p>
            <p className="text-xs text-shamrock-700">{busy.label}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-shamrock-100">
              <div className="h-full bg-shamrock-500 transition-all" style={{ width: `${busy.pct}%` }} />
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Proof of living here, year by year" subtitle="Each year needs its own proofs.">
          <div className="grid gap-3">
            {assessment.years.map((y) => (
              <div key={y.index} className="rounded-xl border border-ink-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{y.label}</p>
                    <p className="text-xs text-ink-600">{formatLong(y.start)} to {formatLong(y.end)}</p>
                  </div>
                  <StatePill state={y.proofState} />
                </div>
                <p className="mt-2 text-sm text-ink-600">{y.proofMessage}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Your documents" subtitle={`${documents.length} uploaded`}>
          {documents.length === 0 ? (
            <Empty>Nothing uploaded yet. Start with your passport and your marriage certificate.</Empty>
          ) : (
            <ul className="divide-y divide-ink-100">
              {documents.map((d) => (
                <li key={d.id} className="py-3">
                  <button className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{d.fileName}</p>
                      <p className="text-xs text-ink-600">
                        {docTypeById(d.docTypeId)?.name ?? d.docTypeId}
                        {d.coversFrom && ` · covers ${formatLong(d.coversFrom)} to ${formatLong(d.coversTo)}`}
                      </p>
                    </div>
                    <StatePill state={documentState(d)} />
                  </button>
                  {openId === d.id && (
                    <DocumentDetail doc={d} onUpsert={onUpsert} onRemove={onRemove} onRerun={() => rerun(d)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function DocumentDetail({ doc, onUpsert, onRemove, onRerun }: {
  doc: StoredDocument
  onUpsert: (d: StoredDocument) => void
  onRemove: (id: string) => void
  onRerun: () => void
}) {
  const [showText, setShowText] = useState(false)

  const openFile = async () => {
    const blob = await loadFile(doc.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="mt-3 rounded-xl bg-ink-50 p-4">
      <ul className="grid gap-2">
        {doc.checks.map((c) => (
          <li key={c.criterionId} className="flex items-start gap-3">
            <StatePill state={c.state} label={c.state === 'pass' ? 'OK' : c.state === 'fail' ? 'No' : '?'} />
            <div className="min-w-0">
              <p className="text-sm text-ink-900">{c.label}</p>
              <p className="text-xs text-ink-600">{c.evidence}</p>
            </div>
          </li>
        ))}
        {doc.checks.length === 0 && <li className="text-sm text-ink-600">No checks run yet.</li>}
      </ul>

      {doc.checks.some((c) => c.state !== 'pass') && (
        <label className="mt-3 flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-ink-200">
          <input type="checkbox" className="mt-0.5 size-4 accent-[color:var(--color-shamrock-600)]"
            checked={doc.userConfirmed}
            onChange={(e) => onUpsert({ ...doc, userConfirmed: e.target.checked })} />
          <span className="text-sm text-ink-800">
            I have looked at this document myself and it is right.
            <span className="mt-0.5 block text-xs text-ink-600">Ticking this lets the document count, even where the app could not read it.</span>
          </span>
        </label>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Covers from">
          <input type="date" className={inputClass} value={doc.coversFrom}
            onChange={(e) => onUpsert({ ...doc, coversFrom: e.target.value })} />
        </Field>
        <Field label="Covers to">
          <input type="date" className={inputClass} value={doc.coversTo}
            onChange={(e) => onUpsert({ ...doc, coversTo: e.target.value })} />
        </Field>
      </div>

      <Field label="Your notes">
        <textarea className={inputClass} rows={2} value={doc.notes}
          onChange={(e) => onUpsert({ ...doc, notes: e.target.value })} />
      </Field>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={openFile}>Open file</Button>
        <Button variant="ghost" onClick={onRerun}>Run checks again</Button>
        <Button variant="ghost" onClick={() => setShowText(!showText)}>
          {showText ? 'Hide' : 'Show'} the text we read
        </Button>
        <Button variant="danger" onClick={() => onRemove(doc.id)}>Delete</Button>
      </div>

      {showText && (
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-white p-3 text-xs whitespace-pre-wrap text-ink-600 ring-1 ring-ink-200">
          {doc.ocrText || 'No text could be read from this file.'}
        </pre>
      )}
      <p className="mt-2 text-xs text-ink-400">
        Uploaded {formatLong(toISO(new Date(doc.uploadedAt)))}
        {doc.ocrConfidence !== null && ` · text read with ${doc.ocrConfidence}% confidence`}
      </p>
    </div>
  )
}
