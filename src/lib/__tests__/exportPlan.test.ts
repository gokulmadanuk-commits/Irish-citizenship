import { describe, expect, it } from 'vitest'
import { contentsText, planExport, safeName, yearForDocument } from '../exportPlan'
import { assess } from '../../rules/engine'
import type { Profile, StoredDocument } from '../types'

const APPLY = '2026-11-01'
const profile: Profile = {
  applicantFullName: 'Test Person',
  dateOfBirth: '1988-07-06',
  nationality: 'Indian',
  currentAddress: '5 Example Avenue, Bangor, BT20 1AA',
  movedToIslandOn: '2023-05-01',
  marriageDate: '2019-04-25',
  spouseFullName: 'Partner Name',
  spouseIrishCitizenshipProof: 'irish-passport',
  livingTogether: true,
  ukImmigrationStatus: 'UK spouse visa',
  plannedApplicationDate: APPLY,
}

const doc = (id: string, docTypeId: string, fileName: string, coversFrom = '', coversTo = ''): StoredDocument => ({
  id, docTypeId, fileName, mimeType: 'application/pdf', sizeBytes: 1,
  uploadedAt: '2026-09-01T00:00:00.000Z', coversFrom, coversTo,
  ocrText: '', ocrState: 'done', ocrConfidence: 90,
  checks: [{ criterionId: 'x', label: 'x', state: 'pass', evidence: '' }],
  userConfirmed: false, notes: '',
})

describe('the download plan', () => {
  it('makes one numbered folder per section, in the same order as the screen', () => {
    const a = assess(profile, [], [], {}, APPLY)
    const plan = planExport(a, [])
    expect(plan.map((s) => s.folder)).toEqual([
      '01 Proof you lived here, year by year',
      '02 Proof you and your partner share a home',
      '03 Who you are',
      '04 Your marriage',
      "05 Your partner's Irish citizenship",
      '06 Your UK immigration permission',
      '07 Good character and police checks',
    ])
  })

  it('files a tax year that spans two residence years under the one you need to prove', () => {
    const tax = doc('t', 'self-assessment', 'return.pdf', '2023-04-06', '2024-04-05')
    const a = assess(profile, [tax], [], {}, APPLY)
    // Year 4 holds 7 months of this tax year and Year 3 holds 5, but only Year 3 needs proof.
    expect(yearForDocument(tax, a)).toBe(3)
    const recent = doc('b', 'utility-bill', 'bill.pdf', '2026-02-01', '2026-02-28')
    expect(yearForDocument(recent, assess(profile, [recent], [], {}, APPLY))).toBe(1)
  })

  it('puts a residence document with no dates in its own folder instead of guessing', () => {
    const undated = doc('u', 'utility-bill', 'bill.pdf')
    const plan = planExport(assess(profile, [undated], [], {}, APPLY), [undated])
    expect(plan[0].files[0].folder).toBe('01 Proof you lived here, year by year/Not matched to a year yet')
  })

  it('names the year folder with its dates', () => {
    const bill = doc('b', 'utility-bill', 'bill.pdf', '2026-02-01', '2026-02-28')
    const plan = planExport(assess(profile, [bill], [], {}, APPLY), [bill])
    expect(plan[0].files[0].folder).toBe('01 Proof you lived here, year by year/Year 1 (1 Nov 2025 to 1 Nov 2026)')
    expect(plan[0].files[0].fileName).toBe('Utility bill - bill.pdf')
  })

  it('puts other documents straight into their section folder', () => {
    const pass = doc('p', 'passport-biometric', 'passport.jpg')
    const plan = planExport(assess(profile, [pass], [], {}, APPLY), [pass])
    const f = plan.find((s) => s.sectionId === 'identity')!.files[0]
    expect(f.folder).toBe('03 Who you are')
    expect(f.fileName).toBe('Your passport - certified colour copy of the photo page - passport.jpg')
  })

  it('never gives two files the same name in one folder', () => {
    const a1 = doc('1', 'shared-address-proof', 'scan.pdf')
    const a2 = doc('2', 'shared-address-proof', 'scan.pdf')
    const plan = planExport(assess(profile, [a1, a2], [], {}, APPLY), [a1, a2])
    const names = plan.find((s) => s.sectionId === 'shared-home')!.files.map((f) => f.fileName)
    expect(new Set(names).size).toBe(2)
    expect(names[1]).toMatch(/\(2\)\.pdf$/)
  })

  it('lists residence files Year 1 first, whatever order they were uploaded in', () => {
    const old = doc('o', 'utility-bill', 'old.pdf', '2024-02-01', '2024-02-28')
    const recent = doc('r', 'utility-bill', 'new.pdf', '2026-02-01', '2026-02-28')
    const plan = planExport(assess(profile, [old, recent], [], {}, APPLY), [old, recent])
    expect(plan[0].files.map((f) => f.yearIndex)).toEqual([1, 3])
  })

  it('strips characters a file system cannot hold', () => {
    expect(safeName('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j')
    expect(safeName('   ')).toBe('document')
  })

  it('lists every section and every file on the contents page', () => {
    const bill = doc('b', 'utility-bill', 'bill.pdf', '2026-02-01', '2026-02-28')
    const a = assess(profile, [bill], [], {}, APPLY)
    const text = contentsText(planExport(a, [bill]), 'Test Person', APPLY, '2026-09-27')
    expect(text).toContain('Applicant: Test Person')
    expect(text).toContain('PROOF YOU LIVED HERE, YEAR BY YEAR')
    expect(text).toContain('Year 1 (1 Nov 2025 to 1 Nov 2026)/Utility bill - bill.pdf')
    expect(text).toContain('GOOD CHARACTER AND POLICE CHECKS')
    expect(text).toContain('(nothing uploaded yet)')
  })
})
