// Every legal number and rule in one file, with its source.
// Route: naturalisation as the spouse or civil partner of an Irish citizen,
// section 15A of the Irish Nationality and Citizenship Act 1956, as amended.
import type { NextStep } from '../lib/types'

export interface RuleMeta {
  id: string
  title: string
  plainEnglish: string
  legalBasis: string
  sources: string[]
}

const ISD_GUIDE = 'https://www.irishimmigration.ie/citizenship/'
const ISD_PROOFS = 'https://www.irishimmigration.ie/citizenship/proofs-of-identity-and-residency/'
const CI = 'https://www.citizensinformation.ie/en/moving-country/irish-citizenship/becoming-an-irish-citizen-through-naturalisation/'
const ACT_15A = 'https://revisedacts.lawreform.ie/eli/1956/act/26/revised/en/html'
const ACT_2023 = 'https://www.irishstatutebook.ie/eli/2023/act/18/enacted/en/html'
const SI_389 = 'https://www.irishstatutebook.ie/eli/2023/si/389/made/en/print'

export interface Ruleset {
  rulesetDate: string
  summary: string

  // Marriage
  marriageYearsRequired: number

  // Residence
  totalResidenceYears: number
  lookbackYears: number
  lookbackDaysRequired: number
  continuousYearAbsenceLimitDays: number
  continuousYearAbsenceCeilingDays: number

  // Evidence
  pointsRequiredPerYear: number
  strongProofPoints: number
  supportingProofPoints: number
  sharedAddressDocId: string
  sharedAddressProofsPerPerson: number
  sharedAddressMonths: number

  coreDocumentIds: string[]
  selfDeclaredRuleIds: string[]
  rules: RuleMeta[]
  standingSteps: Array<Pick<NextStep, 'id' | 'title' | 'detail' | 'priority'>>
  explain: Record<'totalResidence' | 'continuousYear' | 'absences' | 'northernIreland' | 'ukVisa' | 'evidence', string>
  fees: string
  processingTime: string
  riskFlags: string[]
  uncertainties: string[]
  allSources: string[]
  disclaimer: string
}

export const RULESET: Ruleset = {
  rulesetDate: '5 September 2026',
  summary:
    'You are applying as the spouse of an Irish citizen. This route has its own rules. You need three years of marriage, and three years living on the island of Ireland inside the last five years. Northern Ireland counts. The last twelve months must be unbroken.',

  marriageYearsRequired: 3,

  totalResidenceYears: 3,
  lookbackYears: 4,
  lookbackDaysRequired: 730,
  continuousYearAbsenceLimitDays: 70,
  continuousYearAbsenceCeilingDays: 100,

  pointsRequiredPerYear: 150,
  strongProofPoints: 100,
  supportingProofPoints: 50,
  sharedAddressDocId: 'shared-address-proof',
  sharedAddressProofsPerPerson: 3,
  sharedAddressMonths: 3,

  coreDocumentIds: [
    'passport-biometric',
    'passport-certification-form',
    'birth-certificate',
    'marriage-certificate',
    'marriage-certification-form',
    'spouse-irish-proof',
    'spousal-declaration',
    'character-declaration',
    'uk-permission',
  ],

  selfDeclaredRuleIds: ['good-character', 'intention-to-reside'],

  rules: [
    {
      id: 'marriage-duration',
      title: 'Married for at least three years',
      plainEnglish: 'On the day you apply, you must have been married for three years or more.',
      legalBasis: 'Irish Nationality and Citizenship Act 1956, section 15A(1)(c)',
      sources: [ACT_15A, ISD_GUIDE],
    },
    {
      id: 'marriage-subsisting',
      title: 'Still married and living together',
      plainEnglish: 'The marriage must be real, still going, and you must live together when you apply. Your Irish partner signs a declaration to say so.',
      legalBasis: 'Section 15A(1)(c) and (d)',
      sources: [ACT_15A, ISD_GUIDE],
    },
    {
      id: 'spouse-irish',
      title: 'Your partner is an Irish citizen',
      plainEnglish: 'Your partner must be an Irish citizen. Holding British citizenship as well makes no difference. Ireland allows dual citizenship.',
      legalBasis: 'Section 15A(1)',
      sources: [ACT_15A, ISD_GUIDE],
    },
    {
      id: 'continuous-final-year',
      title: 'One unbroken year just before you apply',
      plainEnglish: 'You must have lived on the island of Ireland for the whole twelve months before you apply. You can be away up to 70 days. Up to 100 days may be allowed for special reasons. Over 100 days there is no discretion and you lose the fee.',
      legalBasis: 'Section 15A(1)(e) and section 15C, in force since 31 July 2023',
      sources: [ACT_15A, ACT_2023, SI_389, ISD_GUIDE],
    },
    {
      id: 'total-residence',
      title: 'Two more years in the four years before that',
      plainEnglish: 'On top of the unbroken year, you need two years of living on the island of Ireland inside the four years before that year. These two years do not have to be unbroken.',
      legalBasis: 'Section 15A(1)(f)',
      sources: [ACT_15A, CI],
    },
    {
      id: 'residence-start',
      title: 'You arrived early enough',
      plainEnglish: 'Three years must have passed since you moved to the island of Ireland.',
      legalBasis: 'Section 15A(1)(e) and (f) together',
      sources: [ACT_15A],
    },
    {
      id: 'lawful-residence',
      title: 'Your time here was lawful, with no gaps',
      plainEnglish: 'Time in Northern Ireland only counts while you hold a valid UK permission. A UK spouse visa counts. A student visa does not, and neither does time waiting on an asylum claim. A gap in permission is a common reason for refusal.',
      legalBasis: 'Immigration Service Delivery guidance for residence in Northern Ireland',
      sources: [ISD_GUIDE, ISD_PROOFS],
    },
    {
      id: 'residence-evidence',
      title: 'Paper proof for every year you claim',
      plainEnglish: 'Each year needs 150 points of proof. A strong document is 100 points. A supporting document is 50. You must have at least one strong document in every year.',
      legalBasis: 'Immigration Service Delivery residency scorecard',
      sources: [ISD_PROOFS],
    },
    {
      id: 'shared-address',
      title: 'Proof you share a home right now',
      plainEnglish: 'You need three documents each, six in total, showing you and your partner at the same address for the three months just before you apply.',
      legalBasis: 'Immigration Service Delivery marriage route document list',
      sources: [ISD_GUIDE],
    },
    {
      id: 'core-documents',
      title: 'The main paperwork',
      plainEnglish: 'Passport copy, certification forms, birth certificate, marriage certificate, proof your partner is Irish, and both declarations.',
      legalBasis: 'Immigration Service Delivery online application',
      sources: [ISD_GUIDE, ISD_PROOFS],
    },
    {
      id: 'good-character',
      title: 'Good character',
      plainEnglish: 'You must be of good character. The Gardaí give a report. You must declare every conviction, driving offence, caution and open case, from any country.',
      legalBasis: 'Section 15A(1)(b)',
      sources: [ACT_15A, CI],
    },
    {
      id: 'intention-to-reside',
      title: 'You mean to stay',
      plainEnglish: 'You must honestly intend to keep living on the island of Ireland after you become a citizen. On this route, staying in Northern Ireland counts.',
      legalBasis: 'Section 15A(1)(g)',
      sources: [ACT_15A],
    },
  ],

  standingSteps: [
    {
      id: 'std:certify',
      title: 'Book a certifier for your copies',
      detail: 'Only a practising solicitor, commissioner for oaths, notary public or peace commissioner can certify. It must be done in person, with the original and the copy in front of them. Not by post or email.',
      priority: 'important',
    },
    {
      id: 'std:forms',
      title: 'Download the current forms on the day you use them',
      detail: 'Old versions of the declaration and certification forms are returned. Always take the newest one from the Immigration Service Delivery site.',
      priority: 'important',
    },
    {
      id: 'std:evisa',
      title: 'Save dated proof of your UK status',
      detail: 'Take dated screenshots of your UKVI account and keep every Home Office decision letter. A share code only lasts 90 days.',
      priority: 'important',
    },
    {
      id: 'std:absences',
      title: 'Write down every trip, including trips to Great Britain',
      detail: 'England, Scotland and Wales are not on the island of Ireland. Those trips use up your 70 days. Nobody stamps your passport, so you must keep your own record.',
      priority: 'important',
    },
    {
      id: 'std:bank-question',
      title: 'Ask the Citizenship Division about Northern Ireland bank statements',
      detail: 'The published rule says bank statements must come from a bank regulated in Ireland or the EU. A Northern Ireland bank is regulated in the UK. Ask them in writing before you rely on your bank statements as your strong proof.',
      priority: 'blocker',
    },
    {
      id: 'std:apply',
      title: 'Apply on the online portal and pay the fee',
      detail: 'Applications go through the Immigration Service Delivery online portal. The fee is 175 euro when you apply. If you are approved there is a further fee of up to 950 euro for the certificate. Once you submit, you cannot edit it, so save a copy.',
      priority: 'nice-to-have',
    },
    {
      id: 'std:vetting',
      title: 'Finish Garda e-vetting when they email you',
      detail: 'After you submit, you get a link to the e-vetting system. Complete it through the portal.',
      priority: 'nice-to-have',
    },
  ],

  explain: {
    totalResidence:
      'Three years on the island of Ireland inside the last five years. That is one unbroken year just before you apply, plus two more years inside the four years before that.',
    continuousYear:
      'The twelve months before you apply must be unbroken. The clock counts back twelve months from the day you apply.',
    absences:
      'You can be away from the island of Ireland up to 70 days in that final year. Between 71 and 100 days, you must show a special reason from the list in the law, and it is the Minister’s choice. Over 100 days there is no discretion at all and you lose your fee. The day you leave and the day you come back do not count as days away.',
    northernIreland:
      'This route counts residence on the island of Ireland, not just the Republic. So living in Northern Ireland counts in full. Crossing into the Republic is not a trip away. Going to England, Scotland or Wales is.',
    ukVisa:
      'Your time in Northern Ireland only counts while you hold a valid UK permission. A UK spouse visa qualifies. You do not need an Irish stamp or an Irish Residence Permit, and you cannot get one while you live in Northern Ireland.',
    evidence:
      'Each year of residence you claim needs 150 points of paper proof: one strong document worth 100 points plus one supporting document worth 50. Do not send more than you need.',
  },

  fees: '175 euro when you apply. Up to 950 euro more for the certificate if you are approved. The 175 euro is not refunded if you are refused.',
  processingTime: 'Immigration Service Delivery says most applications are decided within 12 months. Citizens Information says most take up to 19 months. There is no appeal against a refusal, but you can apply again.',

  riskFlags: [
    'The scorecard names Irish bank statements only. A Northern Ireland bank is regulated in the UK, so your bank statements may not score as a strong document. An employer letter is the safer strong document for a Northern Ireland applicant.',
    'The three year marriage clock and the three year residence clock are separate. Both must be met on the day you apply.',
    'Any gap in your UK permission breaks the chain of lawful residence.',
    'Trips to Great Britain count against your 70 days, even though they are inside the UK.',
    'Nobody records your border crossings, so your own travel log is the only evidence of your absences.',
    'Copies must be certified in person. A posted or emailed certification is refused.',
    'Do not upload the same file to more than one year, and do not merge several documents into one PDF.',
    'The old paper form asks about absences from "the State". On this route the correct test is absence from the island of Ireland.',
  ],

  uncertainties: [
    'Whether the Department accepts Northern Ireland bank statements as a strong (100 point) document. The published wording points to banks regulated in Ireland or the EU.',
    'Which Northern Ireland document the Department treats as the equivalent of an Irish Revenue Employment Detail Summary. An HMRC P60 is the natural match but is not named in the published scorecard.',
    'What format the Department wants for proof of UK immigration status. It has published nothing about eVisas or share codes.',
    'Whether the 70 day absence allowance applies only to the final unbroken year, or also to the earlier years. The wording of the law points to the final year only.',
    'Official sources give different processing times: 12 months from Immigration Service Delivery, 19 months from Citizens Information.',
    'Photographs and Irish referees were needed on the old paper form. They do not appear in the current online guidance.',
  ],

  allSources: [ACT_15A, ACT_2023, SI_389, ISD_GUIDE, ISD_PROOFS, CI],

  disclaimer:
    'This app is a tracker, not legal advice. Rules, forms and fees change. Check the official sources above, and get advice from a solicitor before you submit.',
}
