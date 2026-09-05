import type { Assessment, Profile } from '../lib/types'
import { Card, Progress, StatePill } from './ui'
import { formatLong } from '../lib/dates'
import { RULESET } from '../rules/ruleset'

export function OverviewPanel({ assessment, profile, onGoTo }: {
  assessment: Assessment
  profile: Profile
  onGoTo: (tab: string) => void
}) {
  const blockers = assessment.nextSteps.filter((s) => s.priority === 'blocker' && !s.done)
  const headline =
    assessment.overall === 'pass' ? 'You look ready to apply.'
    : blockers.length ? `${blockers.length} thing${blockers.length > 1 ? 's' : ''} block you right now.`
    : 'Almost there. A few things need a look.'

  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-medium text-shamrock-700">
              Irish citizenship by naturalisation · spouse of an Irish citizen
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink-900">{headline}</h1>
            <p className="mt-1 text-sm text-ink-600">
              Checked against an application date of {formatLong(assessment.applicationDate)}
              {profile.applicantFullName ? ` for ${profile.applicantFullName}` : ''}.
            </p>
          </div>
          <div className="sm:w-52">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-ink-900">{assessment.readinessPercent}%</span>
              <span className="pb-1 text-xs text-ink-600">ready</span>
            </div>
            <div className="mt-2"><Progress percent={assessment.readinessPercent} /></div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {assessment.years.filter((y) => y.claimed).map((y) => (
          <Card key={y.index} title={y.role === 'continuous' ? 'Year 1 · must be unbroken' : `Year ${y.index}`}
            subtitle={`${formatLong(y.start)} to ${formatLong(y.end)}`}>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Days here</dt>
                <dd className="font-semibold text-ink-900">{y.daysPresent} of {y.daysInWindow}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Days away</dt>
                <dd className="font-semibold text-ink-900">
                  {y.daysAbsent}{y.absenceLimit !== null && ` of ${y.absenceLimit} allowed`}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Proof points</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900">{y.points}/{y.pointsRequired}</span>
                  <StatePill state={y.proofState} />
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-600">{y.proofMessage}</p>
          </Card>
        ))}
      </div>

      <Card title="Every rule, checked" subtitle="Green means met. Amber means the app cannot tell. Red means not met yet.">
        <ul className="divide-y divide-ink-100">
          {assessment.rules.map((r) => (
            <li key={r.ruleId} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{r.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{r.plainEnglish}</p>
                <p className="mt-1 text-sm text-ink-800">{r.message}</p>
                <p className="mt-1 text-xs text-ink-400">{r.legalBasis}</p>
              </div>
              <StatePill state={r.state} />
            </li>
          ))}
        </ul>
      </Card>

      {blockers.length > 0 && (
        <Card title="Fix these first">
          <ul className="grid gap-2">
            {blockers.slice(0, 5).map((b) => (
              <li key={b.id} className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
                <p className="text-sm font-semibold text-rose-900">{b.title}</p>
                <p className="text-sm text-rose-800">{b.detail}</p>
              </li>
            ))}
          </ul>
          <button className="mt-3 text-sm font-semibold text-shamrock-700 hover:underline"
            onClick={() => onGoTo('checklist')}>
            See the full checklist
          </button>
        </Card>
      )}

      <p className="px-1 text-xs text-ink-400">{RULESET.disclaimer}</p>
    </div>
  )
}
