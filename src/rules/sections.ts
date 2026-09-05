// The upload sections on the Documents screen.
// Every rule that needs paperwork has exactly one section here, so the Documents
// screen and the Next steps screen line up item for item.
import type { DocumentSection } from '../lib/types'

export const DOCUMENT_SECTIONS: DocumentSection[] = [
  {
    id: 'residence',
    title: 'Proof you lived here, year by year',
    why: 'Each year you claim needs 150 points. One strong document is 100 points. One supporting document is 50.',
    kind: 'per-year',
    docTypeIds: [
      'bank-statement', 'p60', 'self-assessment', 'tax-submission-receipt',
      'employer-letter', 'social-contributions',
      'utility-bill', 'phone-bill', 'tenancy', 'medical-letter', 'rates-bill', 'credit-card-statement',
    ],
    ruleIds: ['residence-evidence'],
  },
  {
    id: 'shared-home',
    title: 'Proof you and your partner share a home',
    why: 'Three documents each, six in total, covering the three months just before you apply.',
    kind: 'count',
    required: 6,
    docTypeIds: ['shared-address-proof'],
    ruleIds: ['shared-address'],
  },
  {
    id: 'identity',
    title: 'Who you are',
    why: 'Proves your identity. A certified colour copy of your passport photo page is worth all 150 identity points on its own.',
    kind: 'each-required',
    docTypeIds: ['passport-biometric', 'passport-certification-form', 'birth-certificate'],
    ruleIds: ['core-documents'],
  },
  {
    id: 'marriage',
    title: 'Your marriage',
    why: 'Proves when you married and that the marriage is real and ongoing. Your Irish partner signs the declaration.',
    kind: 'each-required',
    docTypeIds: ['marriage-certificate', 'marriage-certification-form', 'spousal-declaration'],
    ruleIds: ['marriage-duration', 'marriage-subsisting'],
  },
  {
    id: 'spouse-citizenship',
    title: "Your partner's Irish citizenship",
    why: 'The photo page of their Irish passport is the simplest proof. A Northern Ireland birth certificate is not proof on its own.',
    kind: 'each-required',
    docTypeIds: ['spouse-irish-proof'],
    ruleIds: ['spouse-irish'],
  },
  {
    id: 'uk-status',
    title: 'Your UK immigration permission',
    why: 'Time in Northern Ireland only counts while you hold a valid UK permission. Show it for all three years, with no gaps.',
    kind: 'each-required',
    docTypeIds: ['uk-permission'],
    ruleIds: ['lawful-residence'],
  },
  {
    id: 'good-character',
    title: 'Good character and police checks',
    why: 'Garda vetting only covers the Republic. Because you live outside the State you must also give a police report for where you live.',
    kind: 'each-required',
    docTypeIds: ['character-declaration', 'police-certificate'],
    optionalDocTypeIds: ['police-certificate-other'],
    ruleIds: ['good-character'],
  },
]

const byId = new Map(DOCUMENT_SECTIONS.map((s) => [s.id, s]))
export function sectionById(id: string): DocumentSection | undefined {
  return byId.get(id)
}

/** Which section a document type belongs to. */
const sectionOfDocType = new Map<string, string>()
for (const s of DOCUMENT_SECTIONS) {
  for (const d of [...s.docTypeIds, ...(s.optionalDocTypeIds ?? [])]) sectionOfDocType.set(d, s.id)
}
export function sectionIdForDocType(docTypeId: string): string | undefined {
  return sectionOfDocType.get(docTypeId)
}

/** Which section covers a given rule, so a next step can point at it. */
const sectionOfRule = new Map<string, string>()
for (const s of DOCUMENT_SECTIONS) {
  for (const r of s.ruleIds) if (!sectionOfRule.has(r)) sectionOfRule.set(r, s.id)
}
export function sectionIdForRule(ruleId: string): string | undefined {
  return sectionOfRule.get(ruleId)
}
