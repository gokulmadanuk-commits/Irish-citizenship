import type { Assessment } from '../lib/types'
import { Card, Empty, Progress } from './ui'
import { sectionById } from '../rules/sections'

const PRIORITY_LABEL = {
  blocker: 'Must do',
  important: 'Should do',
  'nice-to-have': 'Worth doing',
} as const

const PRIORITY_STYLE = {
  blocker: 'bg-rose-100 text-rose-800 ring-rose-200',
  important: 'bg-amber-100 text-amber-900 ring-amber-200',
  'nice-to-have': 'bg-ink-100 text-ink-600 ring-ink-200',
} as const

export function ChecklistPanel({ assessment, overrides, onToggle, onOpenSection }: {
  assessment: Assessment
  overrides: Record<string, boolean>
  onToggle: (id: string, value: boolean) => void
  onOpenSection: (sectionId: string) => void
}) {
  const steps = assessment.nextSteps
  const done = steps.filter((s) => overrides[s.id]).length
  const groups = (['blocker', 'important', 'nice-to-have'] as const).map((p) => ({
    priority: p,
    items: steps.filter((s) => s.priority === p),
  }))

  return (
    <div className="grid gap-5">
      <Card title="What to do next" subtitle={`${done} of ${steps.length} done`}>
        <Progress percent={steps.length ? (done / steps.length) * 100 : 0} />
      </Card>

      {groups.map((g) => (
        g.items.length === 0 ? null : (
          <Card key={g.priority} title={PRIORITY_LABEL[g.priority]}>
            <ul className="grid gap-2">
              {g.items.map((s) => (
                <li key={s.id}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${overrides[s.id] ? 'bg-shamrock-50 ring-shamrock-200' : 'bg-white ring-ink-200 hover:bg-ink-50'}`}>
                    <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[color:var(--color-shamrock-600)]"
                      checked={!!overrides[s.id]}
                      onChange={(e) => onToggle(s.id, e.target.checked)} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${overrides[s.id] ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-600">{s.detail}</span>
                      {s.sectionId && (
                        <button
                          onClick={(e) => { e.preventDefault(); onOpenSection(s.sectionId!) }}
                          className="mt-1 text-xs font-semibold text-shamrock-700 hover:underline"
                        >
                          Open "{sectionById(s.sectionId)?.title ?? 'Documents'}" →
                        </button>
                      )}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${PRIORITY_STYLE[g.priority]}`}>
                      {PRIORITY_LABEL[g.priority]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        )
      ))}

      {steps.length === 0 && <Empty>Nothing to do. Fill in your details to get your list.</Empty>}
    </div>
  )
}
