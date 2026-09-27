// The official blank forms, linked straight from the Department's own website.
// We link rather than keep copies, because the Department sends back any old
// version of a form. Every link was opened and its form reference checked on
// the date below.

export const FORMS_CHECKED_ON = '27 September 2026'

const BASE = 'https://www.irishimmigration.ie/wp-content/uploads/citizenship/'

export interface OfficialForm {
  id: string
  title: string
  /** The reference printed at the bottom of the form. */
  formRef: string
  url: string
  /** The Documents screen section it belongs in. */
  sectionId: string
  /** The document type you upload once it is filled in, if there is one. */
  docTypeId?: string
  /** 'needed' forms everyone on this route sends. 'only-if' forms are a fallback. */
  need: 'needed' | 'only-if'
  /** When you need it, in plain words. */
  when: string
  /** What to do with it, step by step. */
  steps: string[]
}

export const OFFICIAL_FORMS: OfficialForm[] = [
  {
    id: 'passport-certification',
    title: 'Certification of Passport',
    formRef: 'Citz-011/2026',
    url: `${BASE}passport-certification-form-citz-0112026.pdf`,
    sectionId: 'identity',
    docTypeId: 'passport-certification-form',
    need: 'needed',
    when: 'Everyone. It goes with the colour copy of your passport photo page.',
    steps: [
      'Print the form.',
      'Make a colour copy of the photo page of your passport.',
      'Take the form, the copy, your passport and photo ID to a certifier.',
      'They write "Certified to be a true copy of the original document seen by me." on the copy, sign and date it, and fill in the form.',
      'Scan the form and the copy, and upload them as two separate files.',
    ],
  },
  {
    id: 'marriage-certification',
    title: 'Certification of Marriage Certificate',
    formRef: 'Citz-006/2026',
    url: `${BASE}marriage-certificate-certification-form-citizenship-0052026.pdf`,
    sectionId: 'marriage',
    docTypeId: 'marriage-certification-form',
    need: 'needed',
    when: 'Everyone on the marriage route. It goes with the colour copy of your marriage certificate.',
    steps: [
      'Print the form.',
      'Make a colour copy of your marriage certificate.',
      'Take the form, the copy, the original certificate and photo ID to a certifier.',
      'They write "Certified to be a true copy of the original document seen by me." on the copy, sign and date it, and fill in the form.',
      'Scan the form and the copy, and upload them as two separate files.',
    ],
  },
  {
    id: 'spousal-declaration',
    title: 'Statutory Declaration: Spouse of an Irish Citizen',
    formRef: 'STATDEC-13A/2026 SPOUSE',
    url: `${BASE}spousal-declaration-form-citizenship-statdec-13a2026.pdf`,
    sectionId: 'marriage',
    docTypeId: 'spousal-declaration',
    need: 'needed',
    when: 'Everyone on the marriage route. Your Irish partner fills it in and signs it.',
    steps: [
      'Print the form.',
      'Your Irish partner fills it in by hand.',
      'Your partner takes it and photo ID to a certifier, and signs it in front of them. Do not sign it beforehand.',
      'The certifier checks their identity and fills in the witness section.',
      'Get it signed shortly before you submit, not months ahead. It has to be true on the day you apply.',
      'Scan it and upload it.',
    ],
  },
  {
    id: 'residency-affidavit',
    title: 'Residential Proof Affidavit',
    formRef: 'Citz-009/2026',
    url: `${BASE}residency-affidavit-proof-form-citizenship-0092026.pdf`,
    sectionId: 'residence',
    need: 'only-if',
    when: 'Only if you truly cannot reach 150 points for a year. It is the Minister’s choice whether to accept it.',
    steps: [
      'Print the form and fill it in, but leave your signature blank.',
      'Take it and photo ID to a certifier and sign it in front of them.',
      'Scan it and upload it in the year it is for.',
    ],
  },
  {
    id: 'passport-affidavit',
    title: 'Passport Affidavit',
    formRef: 'Citz-008/2026',
    url: `${BASE}download-passport-affidavit-form-citizenship-0082026.pdf`,
    sectionId: 'identity',
    need: 'only-if',
    when: 'Only if you cannot get a passport. If you can get one, you must send the passport instead.',
    steps: [
      'Print the form and fill it in, but leave your signature blank.',
      'Take it and photo ID to a certifier and sign it in front of them.',
      'Add proof that you tried to get a passport.',
    ],
  },
  {
    id: 'birth-affidavit',
    title: 'Birth Affidavit (Adult)',
    formRef: 'Citz-006/2026',
    url: `${BASE}birth-affidavit-citizenship-form-citizenship-0062026.pdf`,
    sectionId: 'identity',
    need: 'only-if',
    when: 'Only if you cannot get your birth certificate. If you can get one, you must send the certificate instead.',
    steps: [
      'Print the form and fill it in, but leave your signature blank.',
      'Take it and photo ID to a certifier and sign it in front of them.',
      'Add proof that you tried to get the certificate.',
    ],
  },
]

/** Documents that have no separate blank form, so the screen can say so instead of staying silent. */
export const NO_PUBLISHED_FORM: Record<string, string> = {
  'character-declaration':
    'The Department lists a statutory declaration of character, but does not publish a separate blank form for it on its citizenship pages. If the online application asks you to upload one, ask through the Customer Service Portal which form to use.',
}

export function formsForSection(sectionId: string): OfficialForm[] {
  return OFFICIAL_FORMS.filter((f) => f.sectionId === sectionId)
}

export function formForDocType(docTypeId: string): OfficialForm | undefined {
  return OFFICIAL_FORMS.find((f) => f.docTypeId === docTypeId)
}
