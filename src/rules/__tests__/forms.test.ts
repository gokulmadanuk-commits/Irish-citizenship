import { describe, expect, it } from 'vitest'
import { OFFICIAL_FORMS, NO_PUBLISHED_FORM, formForDocType, formsForSection } from '../forms'
import { DOCUMENT_SECTIONS } from '../sections'
import { docTypeById } from '../documents'

describe('the official blank forms', () => {
  it('links only to the Department’s own website, over https', () => {
    for (const f of OFFICIAL_FORMS) {
      expect(f.url, f.id).toMatch(/^https:\/\/www\.irishimmigration\.ie\/wp-content\/uploads\/citizenship\/.+\.pdf$/)
    }
  })

  it('puts every form in a real section, against a real document where it names one', () => {
    for (const f of OFFICIAL_FORMS) {
      expect(DOCUMENT_SECTIONS.some((s) => s.id === f.sectionId), f.id).toBe(true)
      if (f.docTypeId) expect(docTypeById(f.docTypeId), f.id).toBeDefined()
    }
  })

  it('has the three forms everyone on the marriage route needs', () => {
    expect(formForDocType('passport-certification-form')?.formRef).toBe('Citz-011/2026')
    expect(formForDocType('marriage-certification-form')?.formRef).toBe('Citz-006/2026')
    expect(formForDocType('spousal-declaration')?.formRef).toBe('STATDEC-13A/2026 SPOUSE')
  })

  it('links the spouse declaration to the spouse form, not the civil partner one', () => {
    expect(formForDocType('spousal-declaration')?.url).toContain('spousal-declaration-form')
    expect(formForDocType('spousal-declaration')?.url).not.toContain('civil-partnership')
  })

  it('marks the affidavits as fallbacks only', () => {
    for (const id of ['residency-affidavit', 'passport-affidavit', 'birth-affidavit']) {
      expect(OFFICIAL_FORMS.find((f) => f.id === id)?.need, id).toBe('only-if')
    }
  })

  it('gives every form plain steps', () => {
    for (const f of OFFICIAL_FORMS) {
      expect(f.steps.length, f.id).toBeGreaterThan(1)
      expect(f.when.length, f.id).toBeGreaterThan(10)
    }
  })

  it('says so out loud where no blank form is published', () => {
    expect(NO_PUBLISHED_FORM['character-declaration']).toContain('does not publish')
    expect(formForDocType('character-declaration')).toBeUndefined()
  })

  it('shows marriage forms in the marriage section', () => {
    expect(formsForSection('marriage').map((f) => f.id)).toEqual(['marriage-certification', 'spousal-declaration'])
  })
})

import { fallbackCovered } from '../forms'
import { assess } from '../engine'
import type { Profile, StoredDocument } from '../../lib/types'

const profile: Profile = {
  applicantFullName: 'Test Person', dateOfBirth: '1988-07-06', nationality: 'Indian',
  currentAddress: '5 Example Avenue, Bangor, BT20 1AA', movedToIslandOn: '2023-05-01',
  marriageDate: '2019-04-25', spouseFullName: 'Partner', spouseIrishCitizenshipProof: 'irish-passport',
  livingTogether: true, ukImmigrationStatus: 'UK spouse visa', plannedApplicationDate: '2026-11-01',
}
const d = (id: string, docTypeId: string, from = '', to = '', certified = false): StoredDocument => ({
  id, docTypeId, fileName: `${id}.pdf`, mimeType: 'application/pdf', sizeBytes: 1,
  uploadedAt: '2026-09-01T00:00:00.000Z', coversFrom: from, coversTo: to, ocrText: '', ocrState: 'done',
  ocrConfidence: 90, checks: [{ criterionId: 'x', label: 'x', state: 'pass', evidence: '' }],
  userConfirmed: false, certified, notes: '',
})
const affidavit = OFFICIAL_FORMS.find((f) => f.id === 'residency-affidavit')!

describe('fallback forms only show when you might need them', () => {
  it('keeps the residence affidavit while a year is short of 150 points', () => {
    const docs = [d('a', 'employer-letter', '2026-01-01', '2026-01-31'), d('b', 'utility-bill', '2026-02-01', '2026-02-28')]
    expect(fallbackCovered(affidavit, assess(profile, docs, [], {}, '2026-11-01'), docs)).toBe(false)
  })

  it('hides it once every year you need has 150 points, even before certifying', () => {
    const docs = [
      d('1a', 'employer-letter', '2026-01-01', '2026-01-31'), d('1b', 'utility-bill', '2026-02-01', '2026-02-28'),
      d('2a', 'employer-letter', '2025-01-01', '2025-01-31'), d('2b', 'utility-bill', '2025-02-01', '2025-02-28'),
      d('3a', 'employer-letter', '2024-01-01', '2024-01-31'), d('3b', 'utility-bill', '2024-02-01', '2024-02-28'),
    ]
    const a = assess(profile, docs, [], {}, '2026-11-01')
    expect(a.years.filter((y) => y.evidenceRequired).every((y) => y.points >= 150)).toBe(true)
    expect(fallbackCovered(affidavit, a, docs)).toBe(true)
  })

  it('hides the passport and birth affidavits once those documents are uploaded', () => {
    const a = assess(profile, [], [], {}, '2026-11-01')
    const passport = OFFICIAL_FORMS.find((f) => f.id === 'passport-affidavit')!
    const birth = OFFICIAL_FORMS.find((f) => f.id === 'birth-affidavit')!
    expect(fallbackCovered(passport, a, [])).toBe(false)
    expect(fallbackCovered(passport, a, [d('p', 'passport-biometric')])).toBe(true)
    expect(fallbackCovered(birth, a, [d('b', 'birth-certificate')])).toBe(true)
  })

  it('never hides a form everyone needs', () => {
    const a = assess(profile, [], [], {}, '2026-11-01')
    for (const f of OFFICIAL_FORMS.filter((x) => x.need === 'needed')) {
      expect(fallbackCovered(f, a, []), f.id).toBe(false)
    }
  })
})
