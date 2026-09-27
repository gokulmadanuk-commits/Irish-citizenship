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
