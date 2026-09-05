import { Card } from './ui'
import { RULESET } from '../rules/ruleset'
import { DOCUMENT_TYPES } from '../rules/documents'

export function RulesPanel() {
  return (
    <div className="grid gap-5">
      <Card title="The rules this app checks" subtitle={`Last checked against official sources on ${RULESET.rulesetDate}.`}>
        <p className="text-sm text-ink-600">{RULESET.summary}</p>
      </Card>

      <Card title="How the residence count works">
        <dl className="grid gap-3 text-sm">
          <Row term="How much residence you need" desc={RULESET.explain.totalResidence} />
          <Row term="The final year" desc={RULESET.explain.continuousYear} />
          <Row term="Time away" desc={RULESET.explain.absences} />
          <Row term="Northern Ireland" desc={RULESET.explain.northernIreland} />
          <Row term="Your UK visa" desc={RULESET.explain.ukVisa} />
          <Row term="Proof for each year" desc={RULESET.explain.evidence} />
          <Row term="What it costs" desc={RULESET.fees} />
          <Row term="How long it takes" desc={RULESET.processingTime} />
        </dl>
      </Card>

      <Card title="Rule by rule">
        <ul className="divide-y divide-ink-100">
          {RULESET.rules.map((r) => (
            <li key={r.id} className="py-3">
              <p className="text-sm font-semibold text-ink-900">{r.title}</p>
              <p className="mt-0.5 text-sm text-ink-600">{r.plainEnglish}</p>
              <p className="mt-1 text-xs text-ink-400">{r.legalBasis}</p>
              {r.sources.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-2">
                  {r.sources.map((s) => (
                    <a key={s} href={s} target="_blank" rel="noreferrer"
                      className="text-xs text-shamrock-700 underline decoration-dotted">
                      {hostOf(s)}
                    </a>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Every document you need">
        <ul className="divide-y divide-ink-100">
          {DOCUMENT_TYPES.map((d) => (
            <li key={d.docId} className="py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink-900">{d.name}</p>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">{d.category}</span>
              </div>
              <p className="mt-0.5 text-sm text-ink-600">{d.whyNeeded}</p>
              <p className="mt-1 text-xs text-ink-400">{d.originalOrCopy}</p>
              {d.niNote && <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-ink-800">{d.niNote}</p>}
            </li>
          ))}
        </ul>
      </Card>

      {RULESET.riskFlags.length > 0 && (
        <Card title="Watch out for these">
          <ul className="grid gap-2">
            {RULESET.riskFlags.map((f, i) => (
              <li key={i} className="rounded-lg bg-amber-50 p-3 text-sm text-ink-800 ring-1 ring-amber-200">{f}</li>
            ))}
          </ul>
        </Card>
      )}

      {RULESET.uncertainties.length > 0 && (
        <Card title="Things you should check yourself" subtitle="The research could not fully confirm these.">
          <ul className="grid gap-2">
            {RULESET.uncertainties.map((f, i) => (
              <li key={i} className="rounded-lg bg-ink-50 p-3 text-sm text-ink-800">{f}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Where this comes from">
        <ul className="grid gap-1">
          {RULESET.allSources.map((s) => (
            <li key={s}>
              <a href={s} target="_blank" rel="noreferrer" className="text-sm text-shamrock-700 underline decoration-dotted break-all">
                {s}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-400">{RULESET.disclaimer}</p>
      </Card>
    </div>
  )
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="font-semibold text-ink-900">{term}</dt>
      <dd className="text-ink-600">{desc}</dd>
    </div>
  )
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}
