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
      doc('employer-letter', '2025-11-01', '2025-11-30'),
      doc('utility-bill', '2026-02-01', '2026-02-28'),
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
})
