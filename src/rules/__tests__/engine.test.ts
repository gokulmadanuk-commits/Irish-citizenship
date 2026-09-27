import { describe, expect, it } from 'vitest'
import { assess, buildYears } from '../engine'
import { RULESET } from '../ruleset'
import type { Absence, CheckResult, Profile, StoredDocument } from '../../lib/types'

const APPLY = '2026-09-05'

const profile = (over: Partial<Profile> = {}): Profile => ({
  applicantFullName: 'Anna Maria Silva',
  dateOfBirth: '1990-04-11',
  nationality: 'Brazilian',
  currentAddress: '12 Example Road, Belfast, BT1 1AA',
  movedToIslandOn: '2023-05-01',
  marriageDate: '2022-06-01',
  spouseFullName: 'Sean Murphy',
  spouseIrishCitizenshipProof: 'irish-passport',
  livingTogether: true,
  ukImmigrationStatus: 'UK spouse visa to 12/2027',
  plannedApplicationDate: APPLY,
  ...over,
})

const trip = (departure: string, ret: string): Absence =>
  ({ id: `${departure}-${ret}`, departure, ret, destination: 'London', reason: 'work', countsAsAbsence: true })

const passing = (ids: string[]): CheckResult[] =>
  ids.map((id) => ({ criterionId: id, label: id, state: 'pass', evidence: 'ok' }))

const doc = (docTypeId: string, coversFrom: string, coversTo: string): StoredDocument => ({
  id: `${docTypeId}-${coversFrom}`,
  docTypeId,
  fileName: `${docTypeId}.pdf`,
  mimeType: 'application/pdf',
  sizeBytes: 1,
  uploadedAt: '2026-09-05T00:00:00.000Z',
  coversFrom,
  coversTo,
  ocrText: 'text',
  ocrState: 'done',
  ocrConfidence: 95,
  checks: passing(['name', 'address', 'dated']),
  userConfirmed: false,
  notes: '',
})

const certified = (d: StoredDocument): StoredDocument => ({ ...d, certified: true })

const ruleState = (a: ReturnType<typeof assess>, id: string) => a.rules.find((r) => r.ruleId === id)?.state

describe('residence windows', () => {
  it('makes one continuous year plus a four year lookback', () => {
    const years = buildYears(APPLY, '2023-05-01', [], [])
    expect(years).toHaveLength(1 + RULESET.lookbackYears)
    expect(years[0].role).toBe('continuous')
    expect(years[0].start).toBe('2025-09-05')
    expect(years[0].end).toBe('2026-09-05')
    expect(years[4].start).toBe('2021-09-05')
  })

  it('does not count time before you arrived', () => {
    const years = buildYears(APPLY, '2023-05-01', [], [])
    // Year 4 runs Sep 2022 to Sep 2023; the applicant arrived on 1 May 2023.
    expect(years[3].daysPresent).toBeGreaterThan(0)
    expect(years[3].daysBeforeArrival).toBeGreaterThan(200)
    expect(years[3].daysAbsent).toBe(0)
    // Year 5 is entirely before arrival.
    expect(years[4].claimed).toBe(false)
    expect(years[4].daysPresent).toBe(0)
  })

  it('subtracts trips away from the days present', () => {
    const years = buildYears(APPLY, '2023-05-01', [trip('2026-01-01', '2026-01-11')], [])
    expect(years[0].daysAbsent).toBe(9)
  })
})

describe('the unbroken final year', () => {
  it('passes when you are away less than the limit', () => {
    const a = assess(profile(), [], [trip('2026-01-01', '2026-01-11')], {}, APPLY)
    expect(ruleState(a, 'continuous-final-year')).toBe('pass')
  })

  it('warns when you are close to the limit', () => {
    const a = assess(profile(), [], [trip('2026-01-01', '2026-03-02')], {}, APPLY)
    expect(a.years[0].daysAbsent).toBe(59)
    expect(ruleState(a, 'continuous-final-year')).toBe('unknown')
  })

  it('fails over 70 days and says discretion is needed', () => {
    const a = assess(profile(), [], [trip('2026-01-01', '2026-03-20')], {}, APPLY)
    expect(a.years[0].daysAbsent).toBe(77)
    expect(ruleState(a, 'continuous-final-year')).toBe('fail')
    expect(a.rules.find((r) => r.ruleId === 'continuous-final-year')?.message).toContain('exceptional')
  })

  it('fails hard over 100 days', () => {
    const a = assess(profile(), [], [trip('2025-10-01', '2026-02-01')], {}, APPLY)
    expect(a.years[0].daysAbsent).toBeGreaterThan(100)
    expect(a.rules.find((r) => r.ruleId === 'continuous-final-year')?.message).toContain('no discretion')
  })
})

describe('the marriage clock', () => {
  it('passes at three years', () => {
    const a = assess(profile({ marriageDate: '2023-09-05' }), [], [], {}, APPLY)
    expect(ruleState(a, 'marriage-duration')).toBe('pass')
  })

  it('fails one day short and names the date you become eligible', () => {
    const a = assess(profile({ marriageDate: '2023-09-06' }), [], [], {}, APPLY)
    expect(ruleState(a, 'marriage-duration')).toBe('fail')
    expect(a.rules.find((r) => r.ruleId === 'marriage-duration')?.message).toContain('6 September 2026')
  })
})

describe('total residence', () => {
  it('passes for someone here since May 2023', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    expect(ruleState(a, 'total-residence')).toBe('pass')
    expect(ruleState(a, 'residence-start')).toBe('pass')
  })

  it('fails for someone who arrived too recently', () => {
    const a = assess(profile({ movedToIslandOn: '2024-06-01' }), [], [], {}, APPLY)
    expect(ruleState(a, 'total-residence')).toBe('fail')
    expect(ruleState(a, 'residence-start')).toBe('fail')
  })
})

describe('the 150 point residence scorecard', () => {
  it('fails a year with only a supporting document', () => {
    const a = assess(profile(), [doc('utility-bill', '2025-10-01', '2025-10-31')], [], {}, APPLY)
    expect(a.years[0].points).toBe(50)
    expect(a.years[0].proofState).toBe('fail')
  })

  it('passes a year with one strong and one supporting document', () => {
    const docs = [
      certified(doc('employer-letter', '2025-11-01', '2025-11-30')),
      certified(doc('utility-bill', '2026-02-01', '2026-02-28')),
    ]
    const a = assess(profile(), docs, [], {}, APPLY)
    expect(a.years[0].points).toBe(150)
    expect(a.years[0].hasStrongProof).toBe(true)
    expect(a.years[0].proofState).toBe('pass')
  })

  it('flags 150 points made up of supporting documents only', () => {
    const docs = [
      doc('utility-bill', '2025-11-01', '2025-11-30'),
      doc('phone-bill', '2026-01-01', '2026-01-31'),
      doc('rates-bill', '2026-03-01', '2026-03-31'),
    ]
    const a = assess(profile(), docs, [], {}, APPLY)
    expect(a.years[0].points).toBe(150)
    expect(a.years[0].hasStrongProof).toBe(false)
    expect(a.years[0].proofState).toBe('unknown')
  })

  it('ignores documents that failed their own checks', () => {
    const bad = doc('employer-letter', '2025-11-01', '2025-11-30')
    bad.checks = [{ criterionId: 'name', label: 'name', state: 'fail', evidence: 'no' }]
    const a = assess(profile(), [bad], [], {}, APPLY)
    expect(a.years[0].points).toBe(0)
  })

  it('counts a document the user has confirmed by hand', () => {
    const unreadable = doc('employer-letter', '2025-11-01', '2025-11-30')
    unreadable.checks = [{ criterionId: 'name', label: 'name', state: 'unknown', evidence: 'could not read' }]
    unreadable.userConfirmed = true
    const a = assess(profile(), [unreadable], [], {}, APPLY)
    expect(a.years[0].points).toBe(100)
  })

  it('asks for no proof in a year before you arrived', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    expect(a.years[4].claimed).toBe(false)
    expect(a.years[4].evidenceRequired).toBe(false)
    expect(a.years[4].proofState).toBe('pass')
  })

  it('only asks for proof of the years you actually rely on', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    const required = a.years.filter((y) => y.evidenceRequired).map((y) => y.index)
    // Year 1 must be unbroken; years 2 and 3 alone cover the two year total.
    expect(required).toEqual([1, 2, 3])
  })
})

describe('next steps', () => {
  it('turns every failed rule into a blocker', () => {
    const a = assess(profile({ marriageDate: '2025-01-01' }), [], [], {}, APPLY)
    expect(a.nextSteps.some((s) => s.id === 'fix:marriage-duration' && s.priority === 'blocker')).toBe(true)
  })

  it('always includes the standing steps', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    for (const s of RULESET.standingSteps) {
      expect(a.nextSteps.some((x) => x.id === s.id)).toBe(true)
    }
  })

  it('marks a step done once the user ticks it', () => {
    const a = assess(profile(), [], [], { 'std:certify': true }, APPLY)
    expect(a.nextSteps.find((s) => s.id === 'std:certify')?.done).toBe(true)
  })

  it('turns a self declared rule green when its own checklist item is ticked', () => {
    const before = assess(profile(), [], [], {}, APPLY)
    expect(ruleState(before, 'good-character')).toBe('unknown')
    const after = assess(profile(), [], [], { 'confirm:good-character': true }, APPLY)
    expect(ruleState(after, 'good-character')).toBe('pass')
  })

  it('does not repeat the year by year proof rule as its own blocker', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    expect(a.nextSteps.some((s) => s.id === 'fix:residence-evidence')).toBe(false)
    expect(a.nextSteps.some((s) => s.id === 'proof:year1')).toBe(true)
  })
})

describe('sections line up with next steps', () => {
  it('reports a status for every section', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    expect(a.sections).toHaveLength(7)
    expect(a.sections.map((s) => s.id)).toContain('shared-home')
  })

  it('marks a section done once its documents are accepted', () => {
    const a = assess(profile(), [certified(doc('spouse-irish-proof', '', ''))], [], {}, APPLY)
    expect(a.sections.find((s) => s.id === 'spouse-citizenship')?.state).toBe('pass')
  })

  it('counts the six shared address proofs', () => {
    const six = Array.from({ length: 6 }, (_, i) => ({
      ...certified(doc('shared-address-proof', '', '')), id: `shared-${i}`,
    }))
    const partial = assess(profile(), six.slice(0, 4), [], {}, APPLY)
    expect(partial.sections.find((s) => s.id === 'shared-home')?.state).toBe('fail')
    const full = assess(profile(), six, [], {}, APPLY)
    expect(full.sections.find((s) => s.id === 'shared-home')?.state).toBe('pass')
  })

  it('points each paperwork step at the section that fixes it', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    const withSection = a.nextSteps.filter((s) => s.sectionId)
    expect(withSection.length).toBeGreaterThan(2)
    for (const s of withSection) {
      expect(a.sections.some((x) => x.id === s.sectionId), `${s.id} points at a missing section`).toBe(true)
    }
    expect(a.nextSteps.find((s) => s.id === 'proof:year1')?.sectionId).toBe('residence')
  })
})

describe('one next step per document section', () => {
  it('gives every unfinished section its own step, pointed at that section', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    for (const s of a.sections) {
      if (s.kind === 'per-year' || s.state === 'pass') continue
      const step = a.nextSteps.find((x) => x.id === `section:${s.id}`)
      expect(step, `no step for section ${s.id}`).toBeDefined()
      expect(step?.sectionId).toBe(s.id)
      expect(step?.priority).toBe('blocker')
    }
  })

  it('drops the step once the section is done', () => {
    const a = assess(profile(), [certified(doc('spouse-irish-proof', '', ''))], [], {}, APPLY)
    expect(a.nextSteps.some((x) => x.id === 'section:spouse-citizenship')).toBe(false)
  })

  it('does not also repeat those sections as one lumped paperwork step', () => {
    const a = assess(profile(), [], [], {}, APPLY)
    expect(a.nextSteps.some((s) => s.id === 'fix:core-documents')).toBe(false)
    expect(a.nextSteps.some((s) => s.id === 'fix:shared-address')).toBe(false)
  })
})

describe('each proof of residence counts for one year only', () => {
  it('does not count a document that spans two years in both', () => {
    const spanning = doc('employer-letter', '2025-06-01', '2025-12-31')
    const a = assess(profile(), [spanning], [], {}, APPLY)
    const total = a.years.reduce((s, y) => s + y.points, 0)
    expect(total).toBe(100)
    expect(a.years.filter((y) => y.proofDocumentIds.includes(spanning.id))).toHaveLength(1)
  })

  it('gives it to the year you need to prove, even if it overlaps another year more', () => {
    // Applying 1 Nov 2026 after arriving 1 May 2023: years 1 to 3 need proof, year 4 does not.
    // Year 4 (Nov 2022 to Nov 2023) holds 7 months of this tax year, Year 3 only 5.
    const taxYear = doc('self-assessment', '2023-04-06', '2024-04-05')
    const a = assess(profile({ plannedApplicationDate: '2026-11-01' }), [taxYear], [], {}, '2026-11-01')
    expect(a.years[3].evidenceRequired).toBe(false)
    const year = a.years.find((y) => y.proofDocumentIds.includes(taxYear.id))
    expect(year?.index).toBe(3)
    expect(a.years[3].points).toBe(0)
  })

  it('otherwise picks the year it overlaps most', () => {
    const mostlyYear1 = doc('employer-letter', '2025-08-01', '2026-03-01')
    const a = assess(profile(), [mostlyYear1], [], {}, APPLY)
    expect(a.years[0].proofDocumentIds).toContain(mostlyYear1.id)
    expect(a.years[1].proofDocumentIds).not.toContain(mostlyYear1.id)
  })
})

describe('right document, not certified yet', () => {
  it('shows a year as Not certified, not Not met, when the points are there', () => {
    const docs = [
      doc('employer-letter', '2025-11-01', '2025-11-30'),
      doc('utility-bill', '2026-02-01', '2026-02-28'),
    ]
    const a = assess(profile(), docs, [], {}, APPLY)
    expect(a.years[0].points).toBe(150)
    expect(a.years[0].uncertifiedCount).toBe(2)
    expect(a.years[0].proofState).toBe('uncertified')
    expect(a.years[0].proofMessage).toContain('still need certifying')
  })

  it('still says Not met when the points are short, whatever the certification', () => {
    const a = assess(profile(), [doc('utility-bill', '2026-02-01', '2026-02-28')], [], {}, APPLY)
    expect(a.years[0].proofState).toBe('fail')
  })

  it('turns green once every counted copy is ticked as certified', () => {
    const docs = [
      certified(doc('employer-letter', '2025-11-01', '2025-11-30')),
      doc('utility-bill', '2026-02-01', '2026-02-28'),
    ]
    const half = assess(profile(), docs, [], {}, APPLY)
    expect(half.years[0].proofState).toBe('uncertified')
    docs[1] = certified(docs[1])
    expect(assess(profile(), docs, [], {}, APPLY).years[0].proofState).toBe('pass')
  })

  it('shows a whole section as Not certified when everything is there', () => {
    const a = assess(profile(), [doc('spouse-irish-proof', '', '')], [], {}, APPLY)
    const s = a.sections.find((x) => x.id === 'spouse-citizenship')!
    expect(s.state).toBe('uncertified')
    expect(s.missingDocTypeIds).toEqual([])
    expect(s.uncertifiedDocumentIds).toHaveLength(1)
    expect(s.message).toContain('still needs certifying')
  })

  it('keeps a section red when something is missing, even if the rest only needs certifying', () => {
    const a = assess(profile(), [doc('marriage-certificate', '', '')], [], {}, APPLY)
    const s = a.sections.find((x) => x.id === 'marriage')!
    expect(s.state).toBe('fail')
    expect(s.missingDocTypeIds).toContain('spousal-declaration')
    expect(s.uncertifiedDocumentIds).toHaveLength(1)
  })

  it('never asks to certify a form the certifier or witness fills in', () => {
    const a = assess(profile(), [doc('spousal-declaration', '', '')], [], {}, APPLY)
    const s = a.sections.find((x) => x.id === 'marriage')!
    expect(s.uncertifiedDocumentIds).toHaveLength(0)
  })

  it('makes a certify-only section an important step, not a blocker', () => {
    const a = assess(profile(), [doc('spouse-irish-proof', '', '')], [], {}, APPLY)
    const step = a.nextSteps.find((x) => x.id === 'section:spouse-citizenship')!
    expect(step.priority).toBe('important')
    expect(step.title).toContain('certified')
  })

  it('lists the waiting files on the book a certifier step', () => {
    const a = assess(profile(), [doc('birth-certificate', '', '')], [], {}, APPLY)
    const step = a.nextSteps.find((x) => x.id === 'std:certify')!
    expect(step.title).toContain('1 document waiting')
    expect(step.detail).toContain('birth-certificate.pdf')
  })

  it('ranks Not certified above Not met but below a full pass in readiness', () => {
    const six = (c: boolean) => Array.from({ length: 6 }, (_, i) => ({
      ...doc('shared-address-proof', '', ''), id: `s${i}`, certified: c,
    }))
    const none = assess(profile(), [], [], {}, APPLY).readinessPercent
    const waiting = assess(profile(), six(false), [], {}, APPLY).readinessPercent
    const done = assess(profile(), six(true), [], {}, APPLY).readinessPercent
    expect(waiting).toBeGreaterThan(none)
    expect(done).toBeGreaterThan(waiting)
  })
})
