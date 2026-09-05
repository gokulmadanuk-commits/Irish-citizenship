import { describe, expect, it } from 'vitest'
import { RULESET } from '../ruleset'
import { DOCUMENT_TYPES, docTypeById } from '../documents'

describe('the ruleset holds together', () => {
  it('uses the statutory numbers for the spouse route', () => {
    expect(RULESET.marriageYearsRequired).toBe(3)
    expect(RULESET.totalResidenceYears).toBe(3)
    expect(RULESET.lookbackYears).toBe(4)
    expect(RULESET.lookbackDaysRequired).toBe(730)
    expect(RULESET.continuousYearAbsenceLimitDays).toBe(70)
    expect(RULESET.continuousYearAbsenceCeilingDays).toBe(100)
  })

  it('uses the published scorecard values', () => {
    expect(RULESET.pointsRequiredPerYear).toBe(150)
    expect(RULESET.strongProofPoints).toBe(100)
    expect(RULESET.supportingProofPoints).toBe(50)
    expect(RULESET.strongProofPoints + RULESET.supportingProofPoints).toBe(RULESET.pointsRequiredPerYear)
  })

  it('names only documents that exist', () => {
    for (const id of RULESET.coreDocumentIds) expect(docTypeById(id), id).toBeDefined()
    expect(docTypeById(RULESET.sharedAddressDocId)).toBeDefined()
  })

  it('gives every self declared rule a definition', () => {
    for (const id of RULESET.selfDeclaredRuleIds) {
      expect(RULESET.rules.some((r) => r.id === id), id).toBe(true)
    }
  })

  it('gives every rule a source and a plain English line', () => {
    for (const r of RULESET.rules) {
      expect(r.plainEnglish.length, r.id).toBeGreaterThan(20)
      expect(r.legalBasis.length, r.id).toBeGreaterThan(5)
      expect(r.sources.length, r.id).toBeGreaterThan(0)
    }
  })

  it('uses unique rule, document and step ids', () => {
    const unique = (xs: string[]) => new Set(xs).size === xs.length
    expect(unique(RULESET.rules.map((r) => r.id))).toBe(true)
    expect(unique(DOCUMENT_TYPES.map((d) => d.docId))).toBe(true)
    expect(unique(RULESET.standingSteps.map((s) => s.id))).toBe(true)
  })

  it('scores every proof of residence document and nothing else', () => {
    for (const d of DOCUMENT_TYPES) {
      if (d.isResidenceProof) {
        expect([RULESET.strongProofPoints, RULESET.supportingProofPoints], d.docId).toContain(d.points)
      } else {
        expect(d.points, d.docId).toBeUndefined()
      }
    }
  })

  it('offers at least one strong and one supporting proof to choose from', () => {
    const proofs = DOCUMENT_TYPES.filter((d) => d.isResidenceProof)
    expect(proofs.some((d) => d.points === RULESET.strongProofPoints)).toBe(true)
    expect(proofs.some((d) => d.points === RULESET.supportingProofPoints)).toBe(true)
  })

  it('gives every source as a real https link', () => {
    for (const s of RULESET.allSources) expect(s).toMatch(/^https:\/\//)
    for (const r of RULESET.rules) {
      for (const s of r.sources) expect(RULESET.allSources, `${r.id} cites an unlisted source`).toContain(s)
    }
  })

  it('says out loud what it could not confirm', () => {
    expect(RULESET.uncertainties.length).toBeGreaterThan(3)
    expect(RULESET.riskFlags.length).toBeGreaterThan(3)
    expect(RULESET.disclaimer).toContain('not legal advice')
  })
})
