import { useState } from 'react'
import { useTracker } from './lib/useTracker'
import { OverviewPanel } from './components/OverviewPanel'
import { ProfilePanel } from './components/ProfilePanel'
import { AbsencesPanel } from './components/AbsencesPanel'
import { DocumentsPanel } from './components/DocumentsPanel'
import { ChecklistPanel } from './components/ChecklistPanel'
import { RulesPanel } from './components/RulesPanel'
import { Button } from './components/ui'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Your details' },
  { id: 'documents', label: 'Documents' },
  { id: 'trips', label: 'Trips away' },
  { id: 'checklist', label: 'Next steps' },
  { id: 'rules', label: 'The rules' },
] as const

export default function App() {
  const t = useTracker()
  const [tab, setTab] = useState<string>('overview')
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)

  const openSection = (sectionId: string) => {
    setOpenSectionId(sectionId)
    setTab('documents')
  }

  if (!t.ready) {
    return <div className="grid h-full place-items-center text-sm text-ink-600">Loading your file…</div>
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-shamrock-600 text-lg text-white">☘</span>
            <div>
              <p className="text-sm font-bold text-ink-900">Irish Citizenship Tracker</p>
              <p className="text-xs text-ink-600">Everything stays on this device</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => window.print()}>Print</Button>
            <Button variant="ghost" onClick={() => {
              if (confirm('Delete everything you have saved in this app? This cannot be undone.')) void t.reset()
            }}>Erase all data</Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {TABS.map((x) => (
            <button key={x.id} onClick={() => { setTab(x.id); if (x.id !== 'documents') setOpenSectionId(null) }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === x.id ? 'bg-shamrock-600 text-white' : 'text-ink-600 hover:bg-ink-100'
              }`}>
              {x.label}
              {x.id === 'checklist' && t.assessment.nextSteps.filter((s) => !s.done).length > 0 && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] ${tab === x.id ? 'bg-white/20' : 'bg-ink-200 text-ink-800'}`}>
                  {t.assessment.nextSteps.filter((s) => !s.done).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'overview' && <OverviewPanel assessment={t.assessment} profile={t.profile} onGoTo={setTab} />}
        {tab === 'profile' && <ProfilePanel profile={t.profile} onChange={t.updateProfile} />}
        {tab === 'documents' && (
          <DocumentsPanel profile={t.profile} documents={t.documents} assessment={t.assessment}
            openSectionId={openSectionId}
            onUpsert={t.upsertDocument} onRemove={t.removeDocument} />
        )}
        {tab === 'trips' && (
          <AbsencesPanel absences={t.absences} assessment={t.assessment}
            onSave={t.upsertAbsence} onRemove={t.removeAbsence} />
        )}
        {tab === 'checklist' && (
          <ChecklistPanel assessment={t.assessment} overrides={t.stepOverrides} onToggle={t.toggleStep}
            onOpenSection={openSection} />
        )}
        {tab === 'rules' && <RulesPanel />}
      </main>
    </div>
  )
}
