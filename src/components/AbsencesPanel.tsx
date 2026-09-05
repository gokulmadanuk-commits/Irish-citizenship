import { useState } from 'react'
import type { Absence, Assessment } from '../lib/types'
import { Button, Card, Empty, Field, StatePill, inputClass } from './ui'
import { absenceDaysInWindow, formatLong } from '../lib/dates'
import { RULESET } from '../rules/ruleset'

export function AbsencesPanel({ absences, assessment, onSave, onRemove }: {
  absences: Absence[]
  assessment: Assessment
  onSave: (a: Absence) => void
  onRemove: (id: string) => void
}) {
  const [draft, setDraft] = useState<Absence>(blank())
  const y1 = assessment.years[0]

  const add = () => {
    if (!draft.departure || !draft.ret) return
    onSave({ ...draft, id: draft.id || crypto.randomUUID() })
    setDraft(blank())
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Card title="Add a trip away" subtitle="Log every time you left the island of Ireland.">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Day you left">
              <input type="date" className={inputClass} value={draft.departure}
                onChange={(e) => setDraft({ ...draft, departure: e.target.value })} />
            </Field>
            <Field label="Day you came back">
              <input type="date" className={inputClass} value={draft.ret}
                onChange={(e) => setDraft({ ...draft, ret: e.target.value })} />
            </Field>
          </div>
          <Field label="Where you went">
            <input className={inputClass} value={draft.destination}
              onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
              placeholder="e.g. London, or Spain" />
          </Field>
          <Field label="Why">
            <input className={inputClass} value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="e.g. holiday, work, family" />
          </Field>
          <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
            <input type="checkbox" className="mt-0.5 size-4 accent-[color:var(--color-amber-brand)]"
              checked={draft.countsAsAbsence}
              onChange={(e) => setDraft({ ...draft, countsAsAbsence: e.target.checked })} />
            <span className="text-sm text-ink-800">
              This trip took me off the island of Ireland.
              <span className="mt-1 block text-xs text-ink-600">
                England, Scotland, Wales, the Isle of Man and the Channel Islands are not on the island of Ireland.
                Trips there count as time away. Travel between Northern Ireland and the Republic does not.
              </span>
            </span>
          </label>
          <div><Button onClick={add} disabled={!draft.departure || !draft.ret}>Add trip</Button></div>
        </div>
      </Card>

      <div className="grid gap-5">
        <Card title="Time away in your final year"
          subtitle={y1 ? `${formatLong(y1.start)} to ${formatLong(y1.end)}` : ''}
          right={y1 ? <StatePill state={y1.absenceState} /> : undefined}>
          {y1 && (
            <div className="grid gap-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-ink-900">{y1.daysAbsent}</span>
                <span className="pb-1 text-sm text-ink-600">days away of {RULESET.continuousYearAbsenceLimitDays} allowed</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-ink-100">
                <div className={`h-full rounded-full ${y1.absenceState === 'fail' ? 'bg-rose-500' : y1.absenceState === 'unknown' ? 'bg-amber-400' : 'bg-shamrock-500'}`}
                  style={{ width: `${Math.min(100, (y1.daysAbsent / Math.max(1, RULESET.continuousYearAbsenceLimitDays)) * 100)}%` }} />
              </div>
              <p className="text-sm text-ink-600">{y1.absenceMessage}</p>
              <p className="text-xs text-ink-400">{RULESET.explain.absences}</p>
            </div>
          )}
        </Card>

        <Card title="Your trips" subtitle={`${absences.length} logged`}>
          {absences.length === 0 ? (
            <Empty>No trips logged yet. Add every trip, even short ones.</Empty>
          ) : (
            <ul className="divide-y divide-ink-100">
              {absences.map((a) => {
                const inFinalYear = y1 ? absenceDaysInWindow(a.departure, a.ret, y1.start, y1.end) : 0
                return (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {a.destination || 'Trip'} · {formatLong(a.departure)} to {formatLong(a.ret)}
                      </p>
                      <p className="text-xs text-ink-600">
                        {a.countsAsAbsence ? `Counts as time away${inFinalYear ? ` · ${inFinalYear} days in your final year` : ''}` : 'Does not count as time away'}
                        {a.reason ? ` · ${a.reason}` : ''}
                      </p>
                    </div>
                    <button onClick={() => onRemove(a.id)} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function blank(): Absence {
  return { id: '', departure: '', ret: '', destination: '', reason: '', countsAsAbsence: true }
}
