// The document catalogue.
// Point values follow the Immigration Service Delivery residency scorecard:
// a strong document ("Type A") is worth 100 points, a supporting document ("Type B") is worth 50.
// You need 150 points for every year of residence you claim, and at least one strong document in each year.
import type { Criterion, DocumentType } from '../lib/types'

const NAME: Criterion = {
  id: 'name',
  label: 'Your full name is on it',
  hint: 'The name must match your passport.',
  autoTest: { kind: 'containsApplicantName' },
}
const ADDRESS: Criterion = {
  id: 'address',
  label: 'Your address on the island of Ireland is on it',
  hint: 'A Northern Ireland postcode (BT...) or an Irish Eircode.',
  autoTest: { kind: 'containsAddress' },
}
const DATED_IN_PERIOD: Criterion = {
  id: 'dated',
  label: 'It is dated inside the period it covers',
  hint: 'The date on the paper must fall in the year you are using it for.',
  autoTest: { kind: 'hasDateInCoveredPeriod' },
}
const HAS_DATE: Criterion = {
  id: 'has-date',
  label: 'It has a date on it',
  hint: 'Undated documents are refused.',
  autoTest: { kind: 'hasAnyDate' },
}
const CERTIFIED: Criterion = {
  id: 'certified',
  label: 'It is a certified colour copy',
  hint: 'A solicitor, commissioner for oaths, notary public or peace commissioner must certify it in person. Not by post or email.',
}

const kw = (id: string, label: string, keywords: string[], hint: string): Criterion => ({
  id, label, hint, autoTest: { kind: 'containsAnyKeyword', keywords },
})

export const DOCUMENT_TYPES: DocumentType[] = [
  // ---------- Strong proof of residence: 100 points ----------
  {
    docId: 'bank-statement',
    name: 'Bank statement (strong, 100 points)',
    category: 'residence-proof',
    whyNeeded: 'The best single proof that you were living at your address in a given year.',
    isResidenceProof: true,
    points: 100,
    originalOrCopy: 'Certified copy. Must show at least three monthly transactions in a row.',
    niNote: 'Warning: the published rule says the bank must be regulated by the Central Bank of Ireland or the European Central Bank. A Northern Ireland bank is regulated in the UK. Ask the Citizenship Division before you rely on this alone.',
    acceptanceCriteria: [
      NAME, ADDRESS, DATED_IN_PERIOD,
      kw('transactions', 'It shows real transactions', ['balance', 'payment', 'debit', 'credit', 'transaction', 'statement'],
        'Three months of transactions in a row, at least three a month.'),
    ],
  },
  {
    docId: 'p60',
    name: 'P60 or Employment Detail Summary (strong, 100 points)',
    category: 'residence-proof',
    whyNeeded: 'Shows you worked and were taxed while living here for that tax year.',
    isResidenceProof: true,
    points: 100,
    originalOrCopy: 'Certified copy.',
    niNote: 'In Northern Ireland this is your HMRC P60. The Irish version is the Revenue Employment Detail Summary.',
    acceptanceCriteria: [
      NAME, ADDRESS, DATED_IN_PERIOD,
      kw('tax', 'It is a tax or pay record', ['p60', 'hmrc', 'revenue', 'paye', 'employment detail summary', 'national insurance', 'tax year'],
        'Issued by HMRC, Revenue or your employer.'),
    ],
  },
  {
    docId: 'employer-letter',
    name: 'Letter from your employer (strong, 100 points)',
    category: 'residence-proof',
    whyNeeded: 'Confirms the exact dates you worked here. This one works the same in Northern Ireland as in the Republic.',
    isResidenceProof: true,
    points: 100,
    originalOrCopy: 'Certified copy. Must be on headed paper and signed.',
    niNote: 'This is often the safest strong document for a Northern Ireland applicant.',
    acceptanceCriteria: [
      NAME, ADDRESS, DATED_IN_PERIOD,
      kw('employment', 'It confirms your employment dates', ['employed', 'employment', 'employee', 'start date', 'commenced', 'salary', 'contract'],
        'It must give the dates you started and, if it applies, ended.'),
    ],
  },
  {
    docId: 'social-contributions',
    name: 'National Insurance or social contribution statement (strong, 100 points)',
    category: 'residence-proof',
    whyNeeded: 'A government record that you were here and paying in.',
    isResidenceProof: true,
    points: 100,
    originalOrCopy: 'Certified copy.',
    niNote: 'In Northern Ireland ask HMRC for your National Insurance record. The Irish version is the Department of Social Protection contribution statement.',
    acceptanceCriteria: [
      NAME, DATED_IN_PERIOD,
      kw('contributions', 'It is a contributions record', ['national insurance', 'contribution', 'social protection', 'hmrc', 'department of social'],
        'Issued by HMRC or the Department of Social Protection.'),
    ],
  },

  // ---------- Supporting proof of residence: 50 points ----------
  {
    docId: 'utility-bill',
    name: 'Utility bill (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'Backs up a strong document for the same year.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    niNote: 'Power NI, Firmus, SSE Airtricity, NI Water, BT, Sky or Virgin bills all fit here.',
    acceptanceCriteria: [
      NAME, ADDRESS, DATED_IN_PERIOD,
      kw('utility', 'It is a utility bill', ['electricity', 'gas', 'water', 'broadband', 'energy', 'power', 'bill', 'account number'], 'Gas, electricity, water or broadband.'),
    ],
  },
  {
    docId: 'phone-bill',
    name: 'Phone bill (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'Backs up a strong document for the same year.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    acceptanceCriteria: [NAME, ADDRESS, DATED_IN_PERIOD, kw('phone', 'It is a phone bill', ['mobile', 'phone', 'landline', 'calls', 'data'], 'Mobile or landline.')],
  },
  {
    docId: 'tenancy',
    name: 'Tenancy agreement or landlord letter (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'Shows where you lived and for how long.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    niNote: 'A Northern Ireland Housing Executive or housing association letter also fits here.',
    acceptanceCriteria: [NAME, ADDRESS, DATED_IN_PERIOD, kw('tenancy', 'It is a tenancy record', ['tenancy', 'lease', 'landlord', 'rent', 'letting', 'housing executive'], 'A signed agreement or a letter from the landlord.')],
  },
  {
    docId: 'medical-letter',
    name: 'Doctor or hospital letter (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'Shows your address on a health record.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    niNote: 'A GP registration letter or an HSC Trust appointment letter fits here.',
    acceptanceCriteria: [NAME, ADDRESS, DATED_IN_PERIOD, kw('medical', 'It is from a health service', ['gp', 'doctor', 'surgery', 'hospital', 'health', 'clinic', 'trust', 'hsc'], 'From a GP practice, hospital or health trust.')],
  },
  {
    docId: 'rates-bill',
    name: 'Rates bill or property tax bill (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'A council record tied to your home.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    niNote: 'In Northern Ireland this is your Land and Property Services rates bill.',
    acceptanceCriteria: [NAME, ADDRESS, DATED_IN_PERIOD, kw('rates', 'It is a rates or property tax bill', ['rates', 'land and property services', 'lps', 'property tax', 'council'], 'From Land and Property Services or a council.')],
  },
  {
    docId: 'credit-card-statement',
    name: 'Credit card statement (supporting, 50 points)',
    category: 'residence-proof',
    whyNeeded: 'Backs up a strong document for the same year.',
    isResidenceProof: true,
    points: 50,
    originalOrCopy: 'Certified copy.',
    acceptanceCriteria: [NAME, ADDRESS, DATED_IN_PERIOD, kw('card', 'It is a credit card statement', ['credit card', 'statement', 'minimum payment', 'card number'], 'From your card provider.')],
  },

  // ---------- Identity ----------
  {
    docId: 'passport-biometric',
    name: 'Your passport: certified colour copy of the photo page',
    category: 'identity',
    whyNeeded: 'Proves who you are. On its own it is worth the full 150 identity points.',
    isResidenceProof: false,
    originalOrCopy: 'Certified colour copy. Since 20 April 2023 you no longer send the original unless asked.',
    acceptanceCriteria: [
      NAME, CERTIFIED,
      kw('passport', 'It is the photo page of a passport', ['passport', 'p<', 'authority', 'nationality'], 'The page with your photo and machine readable lines.'),
      HAS_DATE,
    ],
  },
  {
    docId: 'passport-certification-form',
    name: 'Passport certification form',
    category: 'identity',
    whyNeeded: 'Must go with your passport copy. Missing this form is a common reason applications are returned.',
    isResidenceProof: false,
    originalOrCopy: 'The signed and dated form from the certifier.',
    acceptanceCriteria: [
      NAME,
      kw('cert-form', 'The certifier filled it in and signed it', ['solicitor', 'commissioner for oaths', 'notary', 'peace commissioner', 'certify'], 'The certifier must tick their role, sign and date it.'),
      HAS_DATE,
    ],
  },
  {
    docId: 'birth-certificate',
    name: 'Your birth certificate',
    category: 'identity',
    whyNeeded: 'Every applicant must send one. If it is not in English or Irish, add a professional translation.',
    isResidenceProof: false,
    originalOrCopy: 'Certified copy.',
    acceptanceCriteria: [NAME, CERTIFIED, HAS_DATE],
  },

  // ---------- Marriage and your partner ----------
  {
    docId: 'marriage-certificate',
    name: 'Your marriage certificate',
    category: 'marriage',
    whyNeeded: 'Proves the date you married. The 3 year clock runs from this date.',
    isResidenceProof: false,
    originalOrCopy: 'Certified copy, with its own certification of marriage form.',
    acceptanceCriteria: [
      NAME, CERTIFIED, HAS_DATE,
      kw('marriage', 'It is a marriage certificate', ['marriage', 'married', 'civil partnership', 'registrar', 'solemnised'], 'A civil marriage certificate.'),
    ],
  },
  {
    docId: 'marriage-certification-form',
    name: 'Certification of marriage form',
    category: 'marriage',
    whyNeeded: 'Goes with the marriage certificate copy. The certifier fills it in.',
    isResidenceProof: false,
    originalOrCopy: 'The signed and dated form from the certifier.',
    acceptanceCriteria: [
      kw('cert-form-m', 'The certifier filled it in and signed it', ['solicitor', 'commissioner for oaths', 'notary', 'peace commissioner', 'certify'], 'The certifier must tick their role, sign and date it.'),
      HAS_DATE,
    ],
  },
  {
    docId: 'spouse-irish-proof',
    name: "Proof your partner is an Irish citizen",
    category: 'spouse-citizenship',
    whyNeeded: 'The photo page of their Irish passport is the simplest proof. A Northern Ireland birth certificate on its own is not proof of Irish citizenship.',
    isResidenceProof: false,
    originalOrCopy: 'Certified copy.',
    acceptanceCriteria: [
      CERTIFIED, HAS_DATE,
      kw('irish', 'It shows Irish citizenship', ['ireland', 'eire', 'irl', 'irish', 'naturalisation', 'foreign births'], 'Irish passport, Irish birth certificate, naturalisation certificate or Foreign Births Register entry.'),
    ],
  },
  {
    docId: 'spousal-declaration',
    name: 'Statutory declaration by your Irish partner',
    category: 'marriage',
    whyNeeded: 'Your Irish partner declares that the marriage is real, ongoing and that you live together. They sign it in front of an authorised witness.',
    isResidenceProof: false,
    originalOrCopy: 'The current form only. Older versions are returned. Your partner must sign it on or after the day you submit the application.',
    acceptanceCriteria: [
      HAS_DATE,
      kw('declaration', 'It is signed and witnessed', ['declare', 'declaration', 'witness', 'solicitor', 'commissioner for oaths', 'notary', 'peace commissioner'], 'The witness must record how they checked your partner’s identity.'),
    ],
  },
  {
    docId: 'character-declaration',
    name: 'Statutory declaration of character',
    category: 'good-character',
    whyNeeded: 'You declare your record. You must include anything from any country, not just Ireland.',
    isResidenceProof: false,
    originalOrCopy: 'The current form, signed in front of an authorised witness.',
    acceptanceCriteria: [NAME, HAS_DATE, kw('char', 'It is signed and witnessed', ['declare', 'witness', 'solicitor', 'commissioner for oaths', 'notary', 'peace commissioner'], 'Signed in person in front of the witness.')],
  },

  {
    docId: 'police-certificate',
    name: 'Police certificate for your time in the UK',
    category: 'good-character',
    whyNeeded: 'Garda vetting only covers the Republic. Because you live outside the State, you must give a police report for where you live. Applicants in Northern Ireland are asked for a report from the police there.',
    isResidenceProof: false,
    originalOrCopy: 'The certificate as issued. Ask the Citizenship Division which one they want before you pay for it.',
    niNote: 'There are three candidates and the Department does not name one: an ACRO police certificate, an AccessNI basic check, or a PSNI subject access reply. Ask first through the Customer Service Portal.',
    acceptanceCriteria: [
      NAME, HAS_DATE,
      kw('police', 'It is from a police body', ['police', 'psni', 'acro', 'accessni', 'criminal record', 'disclosure', 'conviction'], 'Issued by ACRO, AccessNI or the PSNI.'),
    ],
  },
  {
    docId: 'police-certificate-other',
    name: 'Police certificate from any other country you lived in',
    category: 'good-character',
    whyNeeded: 'You must give a police report from every country you lived in, including the one you came from.',
    isResidenceProof: false,
    originalOrCopy: 'The certificate as issued, with a professional translation if it is not in English or Irish.',
    acceptanceCriteria: [
      NAME, HAS_DATE,
      kw('police-o', 'It is from a police body', ['police', 'criminal record', 'conviction', 'certificate of conduct', 'clearance'], 'Issued by the police or justice body of that country.'),
    ],
  },

  // ---------- Living together, now ----------
  {
    docId: 'shared-address-proof',
    name: 'Proof you and your partner share an address',
    category: 'marriage',
    whyNeeded: 'You need three different documents each, six in total, covering the three months just before you apply.',
    isResidenceProof: false,
    originalOrCopy: 'Copies. Utility bills, bank statements, rent or mortgage papers, or letters from an employer.',
    acceptanceCriteria: [ADDRESS, HAS_DATE],
  },

  // ---------- UK status ----------
  {
    docId: 'uk-permission',
    name: 'Proof of your UK immigration permission',
    category: 'immigration-status',
    whyNeeded: 'Time in Northern Ireland only counts while you hold a valid UK permission. Study permission and a pending asylum claim do not count.',
    isResidenceProof: false,
    originalOrCopy: 'eVisa share code, UKVI account records and your Home Office decision letters. Keep dated screenshots.',
    niNote: 'Share codes expire after 90 days, so take dated screenshots of your status and keep every decision letter. Biometric residence permit cards have expired and can only be used in limited ways, and not after 31 December 2026.',
    acceptanceCriteria: [
      NAME, HAS_DATE,
      kw('uk-status', 'It shows a UK permission and its dates', ['home office', 'ukvi', 'leave to remain', 'leave to enter', 'visa', 'evisa', 'biometric residence permit', 'share code'], 'It must show the dates your permission runs from and to.'),
    ],
  },
]

const byId = new Map(DOCUMENT_TYPES.map((d) => [d.docId, d]))
export function docTypeById(id: string): DocumentType | undefined {
  return byId.get(id)
}
export const RESIDENCE_PROOF_TYPES = DOCUMENT_TYPES.filter((d) => d.isResidenceProof)
