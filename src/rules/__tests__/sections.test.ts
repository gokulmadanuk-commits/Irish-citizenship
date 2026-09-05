import { describe, expect, it } from 'vitest'
import { DOCUMENT_SECTIONS, sectionIdForDocType, sectionIdForRule } from '../sections'
import { DOCUMENT_TYPES, docTypeById } from '../documents'
import { RULESET } from '../ruleset'

describe('the Documents screen sections', () => {
  it('puts every document type in exactly one section', () => {
    const seen = new Map<string, string>()
    for (const s of DOCUMENT_SECTIONS) {
      for (const id of [...s.docTypeIds, ...(s.optionalDocTypeIds ?? [])]) {
        expect(docTypeById(id), `${id} is not a real document type`).toBeDefined()
        expect(seen.has(id), `${id} appears in two sections`).toBe(false)
        seen.set(id, s.id)
      }
    }
    for (const t of DOCUMENT_TYPES) {
      expect(seen.has(t.docId), `${t.docId} has no section`).toBe(true)
    }
  })

  it('covers every rule that needs paperwork', () => {
    const covered = new Set(DOCUMENT_SECTIONS.flatMap((s) => s.ruleIds))
    const paperworkRules = [
      'residence-evidence', 'shared-address', 'core-documents',
      'spouse-irish', 'lawful-residence', 'good-character',
    ]
    for (const id of paperworkRules) {
      expect(covered.has(id), `no section covers ${id}`).toBe(true)
      expect(sectionIdForRule(id), `${id} maps to no section`).toBeDefined()
    }
  })

  it('names only rules that exist', () => {
    for (const s of DOCUMENT_SECTIONS) {
      for (const r of s.ruleIds) {
        expect(RULESET.rules.some((x) => x.id === r), `${s.id} names unknown rule ${r}`).toBe(true)
      }
    }
  })

  it('finds the section for a document type', () => {
    expect(sectionIdForDocType('bank-statement')).toBe('residence')
    expect(sectionIdForDocType('shared-address-proof')).toBe('shared-home')
    expect(sectionIdForDocType('police-certificate')).toBe('good-character')
  })

  it('gives every counted section a number to hit', () => {
    for (const s of DOCUMENT_SECTIONS) {
      if (s.kind === 'count') expect(s.required, s.id).toBeGreaterThan(0)
    }
  })

  it('uses unique section ids and a real title for each', () => {
    const ids = DOCUMENT_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of DOCUMENT_SECTIONS) {
      expect(s.title.length).toBeGreaterThan(3)
      expect(s.why.length).toBeGreaterThan(20)
    }
  })
})
