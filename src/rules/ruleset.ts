// PLACEHOLDER - replaced with the verified research output.
import type { NextStep } from '../lib/types'

export interface RuleMeta {
  id: string
  title: string
  plainEnglish: string
  legalBasis: string
  sources: string[]
}

export interface Ruleset {
  rulesetDate: string
  summary: string
  marriageYearsRequired: number
  residenceYearsRequired: number
  lookbackYears: number
  totalReckonableDaysRequired: number
  finalYearAbsenceLimitDays: number
  absenceRuleNote: string
  proofsPerYear: number
  proofSegmentsPerYear: number
  coreDocumentIds: string[]
  selfDeclaredRuleIds: string[]
  rules: RuleMeta[]
  standingSteps: Array<Pick<NextStep, 'id' | 'title' | 'detail' | 'priority'>>
  explain: {
    totalResidence: string
    continuousYear: string
    absences: string
    northernIreland: string
    ukVisa: string
  }
  fees: string
  processingTime: string
  riskFlags: string[]
  uncertainties: string[]
  allSources: string[]
  disclaimer: string
}

export const RULESET: Ruleset = {
  rulesetDate: '',
  summary: '',
  marriageYearsRequired: 3,
  residenceYearsRequired: 3,
  lookbackYears: 5,
  totalReckonableDaysRequired: 1095,
  finalYearAbsenceLimitDays: 70,
  absenceRuleNote: '',
  proofsPerYear: 3,
  proofSegmentsPerYear: 3,
  coreDocumentIds: [],
  selfDeclaredRuleIds: [],
  rules: [],
  standingSteps: [],
  explain: { totalResidence: '', continuousYear: '', absences: '', northernIreland: '', ukVisa: '' },
  fees: '',
  processingTime: '',
  riskFlags: [],
  uncertainties: [],
  allSources: [],
  disclaimer: '',
}
