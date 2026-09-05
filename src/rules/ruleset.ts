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

const ISD_GUIDE = 'https://www.irishimmigration.ie/how-to-become-an-irish-citizen-guide/'
const ISD_PROOFS = 'https://www.irishimmigration.ie/how-to-become-a-citizen/'
const ISD_LAW = 'https://www.irishimmigration.ie/how-to-become-a-citizen/citizenship-law-policy-and-guidance/'
const ISD_CALCULATOR = 'https://www.irishimmigration.ie/naturalisation-residency-calculator/'
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
    'police-certificate',
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
      plainEnglish: 'You must be of good character. You must declare every offence, from any country, however long ago, including spent convictions. Leaving one out is worse than having one.',
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
      detail: 'England, Scotland, Wales, the Isle of Man and the Channel Islands are not on the island of Ireland. Those trips use up your 70 days. Nobody stamps your passport, so you must keep your own record.',
      priority: 'important',
    },
    {
      id: 'std:bank-question',
      title: 'Ask the Citizenship Division about Northern Ireland bank statements',
      detail: 'The published rule says bank statements must come from a bank regulated in Ireland or the EU. A Northern Ireland bank is regulated in the UK. Ask them in writing before you rely on your bank statements as your strong proof. A letter from your employer is the safer strong document.',
      priority: 'important',
    },
    {
      id: 'std:28-days',
      title: 'Watch the portal for document requests. You get 28 days',
      detail: 'If the Department asks for a document you have 28 days to send it. Miss the deadline and the application is refused, the 175 euro is gone, and you start again. Requests can appear as a portal message, so check the portal as well as your email.',
      priority: 'important',
    },
    {
      id: 'std:employer-letter',
      title: 'Get a letter from your employer for each year',
      detail: 'Three of the four strong documents are written for Irish bodies. An employer letter is the one that plainly works from Northern Ireland. Ask for it on headed paper, signed, giving the dates you worked and your home address.',
      priority: 'important',
    },
    {
      id: 'std:apply',
      title: 'Apply on the online portal and pay the fee',
      detail: 'Applications go through the Immigration Service Delivery online portal. The fee is 175 euro when you apply. If you are approved there is a further fee of up to 950 euro for the certificate. Once you submit, you cannot edit it, so save a copy.',
      priority: 'nice-to-have',
    },
    {
      id: 'std:police-report',
      title: 'Ask which police certificate they want for Northern Ireland',
      detail: 'Garda vetting only covers the Republic. Because you live outside the State you must give a police report as well. Three could fit: an ACRO police certificate, an AccessNI basic check, or a PSNI subject access reply. The Department does not say which, so ask through the Customer Service Portal before you pay.',
      priority: 'important',
    },
    {
      id: 'std:spent-convictions',
      title: 'Declare every offence, even old and spent ones',
      detail: 'You must list every offence wherever it happened and however long ago, including spent convictions and traffic offences. UK rehabilitation rules do not apply here. Giving false information can mean a fine of up to 50,000 euro, five years in prison, and loss of citizenship even after it is granted.',
      priority: 'important',
    },
    {
      id: 'std:vetting',
      title: 'Finish Garda e-vetting when they contact you',
      detail: 'You get an invitation to the e-vetting system. Watch the email address you gave them. An unfinished vetting form holds up your whole application. Give the full six character postcode for every Northern Ireland address you lived at.',
      priority: 'nice-to-have',
    },
  ],

  explain: {
    totalResidence:
      'Three years on the island of Ireland inside the last five years. That is one unbroken year just before you apply, plus two more years inside the four years before that.',
    continuousYear:
      'The twelve months before you apply must be unbroken. The clock counts back twelve months from the day you apply.',
    absences:
      'You can be away from the island of Ireland up to 70 days in that final year. Between 71 and 100 days, you must show a special reason from the list in the law, and it is the Minister’s choice. Over 100 days there is no discretion at all and you lose your fee. The day you leave and the day you come back do not count as days away. Nobody stamps your passport at the border, so your own travel log is the only record.',
    northernIreland:
      'This route counts residence on the island of Ireland, not just the Republic. So living in Northern Ireland counts in full. Crossing into the Republic is not a trip away. Going to England, Scotland, Wales, the Isle of Man or the Channel Islands is.',
    ukVisa:
      'Your time in Northern Ireland only counts while you hold a valid UK permission. A UK spouse visa qualifies. You do not need an Irish stamp or an Irish Residence Permit, and you cannot get one while you live in Northern Ireland.',
    evidence:
      'Each year of residence you claim needs 150 points of paper proof: one strong document worth 100 points plus one supporting document worth 50. Do not send more than you need.',
  },

  fees: '175 euro when you apply, and 950 euro for the certificate if you are approved. The cheaper 200 euro certificate fee is only for a widow, widower or surviving civil partner, so it does not apply to you. The 175 euro is not refunded if your application is returned or refused.',
  processingTime: 'The Department told the Dail on 28 July 2026 that the middle case took about 8 months to decide in 2024 and 2025, with 61,000 applications waiting. Its own guide still says most take up to 12 months, and Citizens Information says 19 months. Plan for 8 to 12 months to a decision, then more time to the ceremony and the certificate.',

  riskFlags: [
    'The three year marriage clock and the three year residence clock are separate. Both must be met on the day you apply. For most people in your position, the marriage clock is the one that decides when you can apply.',
    'Trips to Great Britain, the Isle of Man and the Channel Islands count against your 70 days, even though they are inside the UK or the British Isles.',
    'Nobody records your border crossings, so your own travel log is the only evidence of your absences. Rebuild it from bookings, boarding passes and card payments.',
    'Three of the four strong (100 point) documents are written for Irish bodies: Revenue, the Department of Social Protection, and banks regulated in Ireland or the EU. A letter from your employer is the one that clearly works from Northern Ireland.',
    'The Department nowhere names a single Northern Ireland utility, water, rates, health or housing body. Every mapping in this app is a sensible guess, not published guidance.',
    'Any gap in your UK permission may break the chain of lawful residence.',
    'If the Department asks you for a document, you have 28 days. Miss it and the application is refused, you lose the 175 euro, and you start again. The request may arrive as a message in the portal, not as an email you will notice.',
    'Your partner must sign their declaration on or after the day you submit. Signing it early, while you gather papers, makes it invalid.',
    'Copies must be certified in person by a practising solicitor, commissioner for oaths, peace commissioner or notary public. A friend, an employer or a posted or emailed signature is refused.',
    'Do not upload the same file to more than one year, and do not merge several documents into one PDF.',
    'The ceremony guidance says to bring an in-date Irish Residence Permit card. You cannot have one, because you live in Northern Ireland. Ask the Department what to bring instead.',
    'Your name, your address and the date of your certificate are published in the State gazette, Iris Oifigiuil. There is no way to opt out.',
    'Spent convictions still have to be declared. UK rehabilitation rules do not apply to this application.',
    'Your biometric residence permit card has expired. Proof of UK status now comes from your UKVI account. An expired card can only be used in limited ways, and not after 31 December 2026.',
    'The Minister decides at their absolute discretion. Meeting every rule does not give you a right to citizenship. There is no appeal against a refusal. You can apply again, or ask the High Court to review how your case was handled.',
    'The Department\'s online residency calculator cannot check your case. It is for people living in the Republic and counts Irish permission stamps.',
  ],

  uncertainties: [
    'Whether a UK spouse visa is expressly accepted. The Department never names the UK partner route, biometric residence permits, eVisas or share codes. It only rules out study permission and pending asylum claims.',
    'Whether Northern Ireland bank statements count as a strong (100 point) document. One line on the proofs page expects card payments on the island of Ireland, which fits Northern Ireland. The next line requires a bank regulated in Ireland or the EU, which does not.',
    'Whether an HMRC P60 counts as a strong document for you. The Department mentions P60s, but inside a section written for citizens of the EEA, Switzerland and the UK. You are none of those.',
    'Which Northern Ireland documents count as supporting (50 point) proofs. The Department publishes no Northern Ireland list at all.',
    'Which police certificate the Department accepts from a Northern Ireland resident. It asks for a police clearance certificate, and a parliamentary answer says a PSNI report, but the PSNI does not issue clearance certificates for this purpose.',
    'Whether the 70 day absence allowance applies only to the final unbroken year, or also to the earlier years. The wording of the law points to the final year only, but the old paper form asks about all five.',
    'Whether a gap between UK grants of permission, including the automatic cover while a UK application is pending, breaks your reckonable residence. The Department has published nothing on this.',
    'Whether a solicitor or commissioner for oaths qualified in Northern Ireland can certify your copies. The Department names the four roles but says nothing about where they are qualified.',
    'Whether a Northern Ireland marriage certificate needs any extra stamp. The Department lists EU and EEA countries as needing none, and the UK is not on that list, but it asks for nothing either.',
    'Whether the current paper form still asks for three Irish citizen referees and two photographs. Sources conflict, and the online guidance does not mention them.',
    'How the ceremony rule about bringing an in-date Irish Residence Permit applies to somebody who has never been able to hold one.',
    'Whether "the date of the application" means the day you press submit online. It is the sensible reading, but nobody says it in writing.',
    'Whether the 175 euro fee is refunded if you are refused after a full look at your case. The Department only says it is not refunded for a returned or incomplete application.',
    'Changes announced in November 2025 are still only proposals: a written meaning for good character, a rule about not claiming social welfare, and possible language or civics tests. Nothing is in law yet.',
    'Official sources give different processing times: about 8 months from the Department in July 2026, 12 months in its own guide, and 19 months from Citizens Information.',
  ],

  allSources: [ACT_15A, ACT_2023, SI_389, ISD_GUIDE, ISD_PROOFS, ISD_LAW, ISD_CALCULATOR, CI],

  disclaimer:
    'This app is a tracker, not legal advice. Rules, forms and fees change. Check the official sources above, and get advice from a solicitor before you submit.',
}
