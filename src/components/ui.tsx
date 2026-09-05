import type { ReactNode } from 'react'
import type { CheckState } from '../lib/types'

export function Card({ title, subtitle, children, right }: {
  title?: string; subtitle?: string; children: ReactNode; right?: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-ink-200/70">
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

const STATE_STYLES: Record<CheckState, string> = {
  pass: 'bg-shamrock-100 text-shamrock-800 ring-shamrock-200',
  fail: 'bg-rose-100 text-rose-800 ring-rose-200',
  unknown: 'bg-amber-100 text-amber-900 ring-amber-200',
}
const STATE_WORDS: Record<CheckState, string> = {
  pass: 'Met',
  fail: 'Not met',
  unknown: 'Needs a look',
}

export function StatePill({ state, label }: { state: CheckState; label?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATE_STYLES[state]}`}>
      {label ?? STATE_WORDS[state]}
    </span>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-800">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-600">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border-0 bg-ink-50 px-3 py-2 text-sm text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-shamrock-500 focus:outline-none'

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean
}) {
  const styles = {
    primary: 'bg-shamrock-600 text-white hover:bg-shamrock-700',
    ghost: 'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  )
}

export function Progress({ percent }: { percent: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className="h-full rounded-full bg-shamrock-500 transition-all duration-500"
        style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
      />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-600">{children}</p>
}
