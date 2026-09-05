// Domain model for the Irish citizenship tracker.
// Everything here lives in the browser only. Nothing is sent to a server.

export type ISODate = string // 'YYYY-MM-DD'

export interface Profile {
  applicantFullName: string
  dateOfBirth: ISODate | ''
  nationality: string
  currentAddress: string
  movedToIslandOn: ISODate | ''
  marriageDate: ISODate | ''
  spouseFullName: string
  spouseIrishCitizenshipProof: 'irish-passport' | 'naturalisation-cert' | 'foreign-birth-register' | 'birth-cert' | 'none'
  livingTogether: boolean
  ukImmigrationStatus: string
  plannedApplicationDate: ISODate | ''
}

/** A trip away from the island of Ireland. Great Britain counts as away. */
export interface Absence {
  id: string
  departure: ISODate
  ret: ISODate
  destination: string
  reason: string
  /** Great Britain, Republic-of-Ireland-internal travel etc. still needs a judgement call. */
  countsAsAbsence: boolean
}

export type DocCategory =
  | 'identity'
  | 'marriage'
  | 'spouse-citizenship'
  | 'residence-proof'
  | 'immigration-status'
  | 'good-character'
  | 'form'

export interface DocumentType {
  docId: string
  name: string
  category: DocCategory
  whyNeeded: string
  acceptanceCriteria: Criterion[]
  /** Proof of residence documents each cover a slice of time. */
  isResidenceProof: boolean
  originalOrCopy: string
  /** ISD residency scorecard value: 100 for a strong (Type A) proof, 50 for a supporting (Type B) proof. */
  points?: number
  /** Notes shown under the document type in the app. */
  niNote?: string
}

export interface Criterion {
  id: string
  label: string
  /** Plain-English hint shown to the user when the check cannot be done automatically. */
  hint: string
  /** Regex or keyword test run against the OCR text, when an automatic test is possible. */
  autoTest?: AutoTest
}

export type AutoTest =
  | { kind: 'containsApplicantName' }
  | { kind: 'containsAddress' }
  | { kind: 'containsAnyKeyword'; keywords: string[] }
  | { kind: 'lacksAnyKeyword'; keywords: string[]; warning: string }
  | { kind: 'hasDateInCoveredPeriod' }
  | { kind: 'hasAnyDate' }

export type CheckState = 'pass' | 'fail' | 'unknown'

export interface CheckResult {
  criterionId: string
  label: string
  state: CheckState
  evidence: string
}

export interface StoredDocument {
  id: string
  docTypeId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  /** Period of time this document is offered as proof for. */
  coversFrom: ISODate | ''
  coversTo: ISODate | ''
  ocrText: string
  ocrState: 'pending' | 'running' | 'done' | 'skipped' | 'failed'
  ocrConfidence: number | null
  checks: CheckResult[]
  userConfirmed: boolean
  notes: string
}

export type YearRole = 'continuous' | 'lookback'

export interface ResidenceYear {
  index: number // 1 = the 12 months immediately before the application date
  role: YearRole
  label: string
  start: ISODate
  end: ISODate
  daysInWindow: number
  /** Days in this window before the applicant moved to the island of Ireland. */
  daysBeforeArrival: number
  /** Days away on logged trips. */
  daysAbsent: number
  daysPresent: number
  /** True when the applicant had arrived on the island for at least part of this window. */
  claimed: boolean
  /** True when this year is one of the years relied on, so it needs 150 points of proof. */
  evidenceRequired: boolean
  /** Only the continuous year has a hard absence limit. */
  absenceLimit: number | null
  absenceCeiling: number | null
  absenceState: CheckState
  absenceMessage: string
  proofDocumentIds: string[]
  points: number
  pointsRequired: number
  hasStrongProof: boolean
  proofState: CheckState
  proofMessage: string
}

export interface RuleOutcome {
  ruleId: string
  title: string
  plainEnglish: string
  legalBasis: string
  state: CheckState
  message: string
  sources: string[]
}

export interface NextStep {
  id: string
  title: string
  detail: string
  priority: 'blocker' | 'important' | 'nice-to-have'
  done: boolean
  /** The Documents screen section that fixes this step, when one does. */
  sectionId?: string
}

/** A group of uploads on the Documents screen. */
export interface DocumentSection {
  id: string
  title: string
  why: string
  /** 'per-year' scores 150 points a year. 'count' needs a number of files. 'each-required' needs one of each type. */
  kind: 'per-year' | 'count' | 'each-required'
  required?: number
  docTypeIds: string[]
  optionalDocTypeIds?: string[]
  /** The rules this section provides the paperwork for. */
  ruleIds: string[]
}

export interface SectionStatus {
  id: string
  title: string
  why: string
  kind: DocumentSection['kind']
  state: CheckState
  message: string
  /** Documents uploaded into this section. */
  documentIds: string[]
  /** Document types still missing, for an 'each-required' section. */
  missingDocTypeIds: string[]
  uploaded: number
  required: number
}

export interface Assessment {
  applicationDate: ISODate
  years: ResidenceYear[]
  rules: RuleOutcome[]
  sections: SectionStatus[]
  nextSteps: NextStep[]
  readinessPercent: number
  overall: CheckState
}
