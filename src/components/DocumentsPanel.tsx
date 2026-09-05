import { useEffect, useRef, useState } from 'react'
import type { Assessment, DocumentSection, Profile, SectionStatus, StoredDocument } from '../lib/types'
import { Button, Card, Empty, Field, StatePill, inputClass } from './ui'
import { DOCUMENT_TYPES, docTypeById } from '../rules/documents'
import { DOCUMENT_SECTIONS } from '../rules/sections'
import { documentState, runChecks } from '../rules/checks'
import { extractText } from '../lib/extract'
import { saveFile, loadFile } from '../lib/storage'
import { formatLong, toISO } from '../lib/dates'

export function DocumentsPanel({ profile, documents, assessment, openSectionId, onUpsert, onRemove }: {
  profile: Profile
  documents: StoredDocument[]
  assessment: Assessment
  openSectionId?: string | null
  onUpsert: (d: StoredDocument) => void
  onRemove: (id: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(openSectionId ?? DOCUMENT_SECTIONS[0]?.id ?? null)

  useEffect(() => {
    if (!openSectionId) return
    setOpenId(openSectionId)
    document.getElementById(`section-${openSectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openSectionId])

  const done = assessment.sections.filter((s) => s.state === 'pass').length

  return (
    <div className="grid gap-5">
      <Card title="Your document sections" subtitle={`${done} of ${assessment.sections.length} sections complete. Files never leave this device.`}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {assessment.sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => {
                  setOpenId(s.id)
                  document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ring-1 ring-ink-200 transition hover:bg-ink-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-900">{s.title}</span>
                  <span className="block truncate text-xs text-ink-600">{s.uploaded} of {s.required}</span>
                </span>
                <StatePill state={s.state} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {DOCUMENT_SECTIONS.map((section) => {
        const status = assessment.sections.find((s) => s.id === section.id)
        if (!status) return null
        return (
          <SectionCard
            key={section.id}
            section={section}
            status={status}
            profile={profile}
            documents={documents}
            assessment={assessment}
            open={openId === section.id}
            onToggle={() => setOpenId(openId === section.id ? null : section.id)}
            onUpsert={onUpsert}
            onRemove={onRemove}
          />
        )
      })}
    </div>
  )
}

function SectionCard({
  section, status, profile, documents, assessment, open, onToggle, onUpsert, onRemove,
}: {
  section: DocumentSection
  status: SectionStatus
  profile: Profile
  documents: StoredDocument[]
  assessment: Assessment
  open: boolean
  onToggle: () => void
  onUpsert: (d: StoredDocument) => void
  onRemove: (id: string) => void
}) {
  const allTypeIds = [...section.docTypeIds, ...(section.optionalDocTypeIds ?? [])]
  const types = DOCUMENT_TYPES.filter((t) => allTypeIds.includes(t.docId))
  const mine = documents.filter((d) => allTypeIds.includes(d.docTypeId))

  return (
    <section id={`section-${section.id}`} className="scroll-mt-32 rounded-2xl bg-white shadow-sm ring-1 ring-ink-200/70">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900">{section.title}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{section.why}</p>
          <p className="mt-1 text-sm font-medium text-ink-800">{status.message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatePill state={status.state} />
          <span className="text-ink-400">{open ? '▾' : '▸'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-ink-100 px-5 py-4">
          {section.kind === 'per-year' && <YearBreakdown assessment={assessment} />}
          {section.kind === 'each-required' && status.missingDocTypeIds.length > 0 && (
            <div className="mb-4 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200">
              <p className="text-sm font-semibold text-rose-900">Still to upload</p>
              <ul className="mt-1 grid gap-1">
                {status.missingDocTypeIds.map((id) => (
                  <li key={id} className="text-sm text-rose-800">• {docTypeById(id)?.name ?? id}</li>
                ))}
              </ul>
            </div>
          )}

          <Uploader section={section} types={types} profile={profile} onUpsert={onUpsert} />

          <h3 className="mt-5 text-sm font-semibold text-ink-900">
            In this section · {mine.length} file{mine.length === 1 ? '' : 's'}
          </h3>
          {mine.length === 0 ? (
            <div className="mt-2"><Empty>Nothing uploaded here yet.</Empty></div>
          ) : (
            <ul className="mt-2 divide-y divide-ink-100">
              {mine.map((d) => (
                <DocumentRow key={d.id} doc={d} profile={profile} onUpsert={onUpsert} onRemove={onRemove} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function YearBreakdown({ assessment }: { assessment: Assessment }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      {assessment.years.filter((y) => y.evidenceRequired).map((y) => (
        <div key={y.index} className="rounded-xl border border-ink-200 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Year {y.index}</p>
              <p className="text-xs text-ink-600">{formatLong(y.start)} to {formatLong(y.end)}</p>
            </div>
            <StatePill state={y.proofState} />
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${y.points >= y.pointsRequired ? 'bg-shamrock-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (y.points / y.pointsRequired) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-600">{y.proofMessage}</p>
        </div>
      ))}
    </div>
  )
}

function Uploader({ section, types, profile, onUpsert }: {
  section: DocumentSection
  types: typeof DOCUMENT_TYPES
  profile: Profile
  onUpsert: (d: StoredDocument) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [docTypeId, setDocTypeId] = useState(types[0]?.docId ?? '')
  const [coversFrom, setCoversFrom] = useState('')
  const [coversTo, setCoversTo] = useState('')
  const [busy, setBusy] = useState<{ name: string; pct: number; label: string } | null>(null)

  const selectedType = docTypeById(docTypeId)
  const needsDates = section.kind === 'per-year'

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
        coversFrom: needsDates ? coversFrom : '',
        coversTo: needsDates ? coversTo : '',
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
        doc = { ...doc, ocrText: res.text, ocrConfidence: res.confidence, ocrState: res.method === 'none' ? 'skipped' : 'done' }
      } catch {
        doc = { ...doc, ocrState: 'failed' }
      }
      doc = { ...doc, checks: runChecks(doc, profile) }
      onUpsert(doc)
      setBusy(null)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <div className={`grid gap-4 lg:items-end ${needsDates ? 'lg:grid-cols-[1.6fr_1fr_1fr_auto]' : 'lg:grid-cols-[1fr_auto]'}`}>
        <Field label="What is this document?">
          <select className={inputClass} value={docTypeId} onChange={(e) => setDocTypeId(e.target.value)}>
            {types.map((t) => <option key={t.docId} value={t.docId}>{t.name}</option>)}
          </select>
        </Field>
        {needsDates && (
          <>
            <Field label="Covers from" hint="First date this proves">
              <input type="date" className={inputClass} value={coversFrom} onChange={(e) => setCoversFrom(e.target.value)} />
            </Field>
            <Field label="Covers to" hint="Last date this proves">
              <input type="date" className={inputClass} value={coversTo} onChange={(e) => setCoversTo(e.target.value)} />
            </Field>
          </>
        )}
        <div className="pb-0.5">
          <input
            ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={!docTypeId}>Choose files</Button>
        </div>
      </div>

      {selectedType && (
        <div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-ink-200">
          <p className="text-sm text-ink-600">{selectedType.whyNeeded}</p>
          <ul className="mt-2 grid gap-1">
            {selectedType.acceptanceCriteria.map((c) => (
              <li key={c.id} className="text-xs text-ink-600">
                • {c.label} <span className="text-ink-400">{c.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-400">{selectedType.originalOrCopy}</p>
          {selectedType.niNote && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-ink-800 ring-1 ring-amber-200">{selectedType.niNote}</p>
          )}
        </div>
      )}

      {busy && (
        <div className="mt-4 rounded-lg bg-shamrock-50 p-4 ring-1 ring-shamrock-200">
          <p className="text-sm font-medium text-shamrock-800">Reading {busy.name}</p>
          <p className="text-xs text-shamrock-700">{busy.label}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-shamrock-100">
            <div className="h-full bg-shamrock-500 transition-all" style={{ width: `${busy.pct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentRow({ doc, profile, onUpsert, onRemove }: {
  doc: StoredDocument
  profile: Profile
  onUpsert: (d: StoredDocument) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [showText, setShowText] = useState(false)

  const openFile = async () => {
    const blob = await loadFile(doc.id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <li className="py-3">
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">{doc.fileName}</p>
          <p className="text-xs text-ink-600">
            {docTypeById(doc.docTypeId)?.name ?? doc.docTypeId}
            {doc.coversFrom && ` · covers ${formatLong(doc.coversFrom)} to ${formatLong(doc.coversTo)}`}
          </p>
        </div>
        <StatePill state={documentState(doc)} />
      </button>

      {open && (
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
              <input
                type="checkbox" className="mt-0.5 size-4 accent-[color:var(--color-shamrock-600)]"
                checked={doc.userConfirmed}
                onChange={(e) => onUpsert({ ...doc, userConfirmed: e.target.checked })}
              />
              <span className="text-sm text-ink-800">
                I have looked at this document myself and it is right.
                <span className="mt-0.5 block text-xs text-ink-600">
                  Ticking this lets the document count, even where the app could not read it.
                </span>
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
            <Button variant="ghost" onClick={() => onUpsert({ ...doc, checks: runChecks(doc, profile) })}>Run checks again</Button>
            <Button variant="ghost" onClick={() => setShowText(!showText)}>{showText ? 'Hide' : 'Show'} the text we read</Button>
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
      )}
    </li>
  )
}
