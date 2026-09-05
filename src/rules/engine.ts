// The rules engine. Pure logic: give it your details and it tells you where you stand.
// Every legal number it uses comes from ruleset.ts, so the law and the code stay apart.
import { addYears, daysBetween, absenceDaysInWindow, formatLong, isAfter, isBefore, overlapDays } from '../lib/dates'
import type {
  Absence, Assessment, CheckState, NextStep, Profile, ResidenceYear, RuleOutcome, StoredDocument,
} from '../lib/types'
import { RULESET } from './ruleset'
import { DOCUMENT_TYPES, docTypeById } from './documents'

const worst = (states: CheckState[]): CheckState =>
  states.includes('fail') ? 'fail' : states.includes('unknown') ? 'unknown' : 'pass'

/** A document counts once every check passes, or the user has confirmed it by hand. */
export function isDocumentAccepted(doc: StoredDocument): boolean {
  if (doc.userConfirmed) return !doc.checks.some((c) => c.state === 'fail')
  return doc.checks.length > 0 && doc.checks.every((c) => c.state === 'pass')
}

export function buildYears(
  applicationDate: string,
  arrivalDate: string,
  absences: Absence[],
  docs: StoredDocument[],
): ResidenceYear[] {
  const years: ResidenceYear[] = []
  const total = 1 + RULESET.lookbackYears

  for (let i = 1; i <= total; i++) {
    const end = addYears(applicationDate, -(i - 1))
    const start = addYears(applicationDate, -i)
    const daysInWindow = daysBetween(start, end)
    const role = i === 1 ? 'continuous' : 'lookback'

    // Days before you arrived on the island are not days of residence.
    const notYetArrived = arrivalDate && isAfter(arrivalDate, start)
      ? Math.min(daysInWindow, Math.max(0, daysBetween(start, arrivalDate)))
      : 0

    const tripDays = absences
      .filter((a) => a.countsAsAbsence && a.departure && a.ret)
      .reduce((sum, a) => sum + absenceDaysInWindow(a.departure, a.ret, start, end), 0)

    const daysPresent = Math.max(0, daysInWindow - notYetArrived - tripDays)
    const claimed = daysPresent > 0

    const limit = role === 'continuous' ? RULESET.continuousYearAbsenceLimitDays : null
    const ceiling = role === 'continuous' ? RULESET.continuousYearAbsenceCeilingDays : null
    let absenceState: CheckState = 'pass'
    let absenceMessage = ''
    if (role === 'continuous') {
      if (tripDays > RULESET.continuousYearAbsenceCeilingDays) {
        absenceState = 'fail'
        absenceMessage = `You were away ${tripDays} days. Over ${RULESET.continuousYearAbsenceCeilingDays} days there is no discretion at all. You would lose the fee.`
      } else if (tripDays > RULESET.continuousYearAbsenceLimitDays) {
        absenceState = 'fail'
        absenceMessage = `You were away ${tripDays} days. The limit is ${RULESET.continuousYearAbsenceLimitDays}. Up to ${RULESET.continuousYearAbsenceCeilingDays} days can be allowed, but only if you can show one of the exceptional reasons in the law, and it is the Minister's choice.`
      } else if (tripDays > RULESET.continuousYearAbsenceLimitDays - 14) {
        absenceState = 'unknown'
        absenceMessage = `You were away ${tripDays} days of the ${RULESET.continuousYearAbsenceLimitDays} allowed. That is close. Log every trip before you apply.`
      } else {
        absenceMessage = `You were away ${tripDays} days of the ${RULESET.continuousYearAbsenceLimitDays} allowed.`
      }
      if (notYetArrived > 0) {
        absenceState = 'fail'
        absenceMessage = `You had not moved to the island of Ireland for ${notYetArrived} days of this year. The final year must be unbroken.`
      }
    } else {
      absenceMessage = notYetArrived > 0
        ? `${daysPresent} days on the island of Ireland. You had not moved here yet for ${notYetArrived} days of this year.`
        : `${daysPresent} days on the island of Ireland in this year.`
    }

    const proofDocs = docs.filter((d) => {
      const t = docTypeById(d.docTypeId)
      if (!t?.isResidenceProof) return false
      if (!d.coversFrom || !d.coversTo) return false
      if (!isDocumentAccepted(d)) return false
      return overlapDays(d.coversFrom, d.coversTo, start, end) > 0
    })

    const points = proofDocs.reduce((s, d) => s + (docTypeById(d.docTypeId)?.points ?? 0), 0)
    const hasStrongProof = proofDocs.some((d) => (docTypeById(d.docTypeId)?.points ?? 0) >= RULESET.strongProofPoints)

    years.push({
      index: i,
      role,
      label: role === 'continuous' ? 'Year 1: the 12 months just before you apply' : `Year ${i}`,
      start,
      end,
      daysInWindow,
      daysBeforeArrival: notYetArrived,
      daysAbsent: tripDays,
      daysPresent,
      claimed,
      evidenceRequired: false,
      absenceLimit: limit,
      absenceCeiling: ceiling,
      absenceState,
      absenceMessage,
      proofDocumentIds: proofDocs.map((d) => d.id),
      points,
      pointsRequired: RULESET.pointsRequiredPerYear,
      hasStrongProof,
      ...judgeProof(false, points, hasStrongProof, proofDocs.length),
    })
  }

  markYearsNeedingEvidence(years)
  for (const y of years) {
    Object.assign(y, judgeProof(y.evidenceRequired, y.points, y.hasStrongProof, y.proofDocumentIds.length))
  }
  return years
}

/**
 * You only prove the years you actually rely on. The unbroken final year is always
 * one of them. After that, take the most recent years until the two year total is
 * covered. Immigration Service Delivery asks applicants not to send more than that.
 */
function markYearsNeedingEvidence(years: ResidenceYear[]) {
  const y1 = years.find((y) => y.role === 'continuous')
  if (y1) y1.evidenceRequired = true
  let remaining = RULESET.lookbackDaysRequired
  for (const y of years.filter((x) => x.role === 'lookback')) {
    if (remaining <= 0) break
    if (!y.claimed) continue
    y.evidenceRequired = true
    remaining -= y.daysPresent
  }
}

function judgeProof(required: boolean, points: number, hasStrong: boolean, count: number) {
  const need = RULESET.pointsRequiredPerYear
  if (!required) {
    return { proofState: 'pass' as CheckState, proofMessage: 'You do not rely on this year, so no proof is needed for it.' }
  }
  if (count === 0) {
    return { proofState: 'fail' as CheckState, proofMessage: `0 of ${need} points. You need one strong proof and one supporting proof.` }
  }
  if (points < need) {
    return { proofState: 'fail' as CheckState, proofMessage: `${points} of ${need} points from ${count} accepted document${count > 1 ? 's' : ''}.` }
  }
  if (!hasStrong) {
    return { proofState: 'unknown' as CheckState, proofMessage: `${points} points, but none of them is a strong proof. You must include at least one strong document.` }
  }
  return { proofState: 'pass' as CheckState, proofMessage: `${points} of ${need} points, including a strong proof.` }
}

export function assess(
  profile: Profile,
  docs: StoredDocument[],
  absences: Absence[],
  stepOverrides: Record<string, boolean>,
  today: string,
): Assessment {
  const applicationDate = profile.plannedApplicationDate || today
  const years = buildYears(applicationDate, profile.movedToIslandOn, absences, docs)
  const rules: RuleOutcome[] = []

  const add = (ruleId: string, state: CheckState, message: string) => {
    const meta = RULESET.rules.find((r) => r.id === ruleId)
    if (!meta) return
    rules.push({
      ruleId, title: meta.title, plainEnglish: meta.plainEnglish,
      legalBasis: meta.legalBasis, sources: meta.sources, state, message,
    })
  }

  // Married long enough.
  if (!profile.marriageDate) {
    add('marriage-duration', 'unknown', 'Add your wedding date to check this.')
  } else {
    const needed = RULESET.marriageYearsRequired
    const eligibleOn = addYears(profile.marriageDate, needed)
    const met = !isAfter(eligibleOn, applicationDate)
    const yearsMarried = daysBetween(profile.marriageDate, applicationDate) / 365.25
    add('marriage-duration', met ? 'pass' : 'fail',
      met
        ? `Married ${yearsMarried.toFixed(1)} years by ${formatLong(applicationDate)}. The rule is ${needed} years.`
        : `You must be married ${needed} years. You reach that on ${formatLong(eligibleOn)}, so you cannot apply before then.`)
  }

  // Marriage is real and you live together.
  add('marriage-subsisting', profile.livingTogether ? 'pass' : 'fail',
    profile.livingTogether
      ? 'You have said the marriage is ongoing and you live together. Your Irish partner must say the same in a signed declaration.'
      : 'You must be living together as a married couple on the day you apply.')

  // Your partner is an Irish citizen.
  add('spouse-irish', profile.spouseIrishCitizenshipProof === 'none' ? 'fail' : 'pass',
    profile.spouseIrishCitizenshipProof === 'none'
      ? 'Choose how you will prove your partner is an Irish citizen.'
      : `You will prove it with ${labelForSpouseProof(profile.spouseIrishCitizenshipProof)}. A certified copy is needed.`)

  // The unbroken final year.
  const y1 = years[0]
  add('continuous-final-year', y1.absenceState, y1.absenceMessage)

  // Two more years inside the four years before that.
  const lookback = years.filter((y) => y.role === 'lookback')
  const lookbackDays = lookback.reduce((s, y) => s + y.daysPresent, 0)
  const needDays = RULESET.lookbackDaysRequired
  add('total-residence', lookbackDays >= needDays ? 'pass' : 'fail',
    lookbackDays >= needDays
      ? `${lookbackDays} days on the island of Ireland in the ${RULESET.lookbackYears} years before your final year. You need ${needDays}.`
      : `${lookbackDays} days on the island of Ireland in the ${RULESET.lookbackYears} years before your final year. You need ${needDays}, so you are ${needDays - lookbackDays} days short.`)

  // Earliest possible application date.
  if (profile.movedToIslandOn) {
    const earliest = addYears(profile.movedToIslandOn, RULESET.totalResidenceYears)
    const ok = !isBefore(applicationDate, earliest)
    add('residence-start', ok ? 'pass' : 'fail',
      ok
        ? `You arrived on ${formatLong(profile.movedToIslandOn)}. The earliest you could apply was ${formatLong(earliest)}.`
        : `You arrived on ${formatLong(profile.movedToIslandOn)}. The earliest you can apply is ${formatLong(earliest)}.`)
  } else {
    add('residence-start', 'unknown', 'Add the date you moved to Northern Ireland or Ireland.')
  }

  // Lawful residence on a UK permission for the whole time.
  add('lawful-residence', profile.ukImmigrationStatus.trim() ? 'unknown' : 'fail',
    profile.ukImmigrationStatus.trim()
      ? 'You must show unbroken lawful UK permission for all three years. Upload your visa letters and eVisa records, then confirm there was no gap.'
      : 'Add your UK immigration status. Residence in Northern Ireland only counts while you hold a valid UK permission.')

  // Proof of residence, year by year.
  const proofYears = years.filter((y) => y.evidenceRequired)
  add('residence-evidence', worst(proofYears.map((y) => y.proofState)),
    proofYears.map((y) => `Year ${y.index}: ${y.points}/${y.pointsRequired} points.`).join(' '))

  // Proof you live at the same address right now.
  const sharedProofs = docs.filter((d) => d.docTypeId === RULESET.sharedAddressDocId && isDocumentAccepted(d)).length
  const needShared = RULESET.sharedAddressProofsPerPerson * 2
  add('shared-address', sharedProofs >= needShared ? 'pass' : 'fail',
    `${sharedProofs} of ${needShared} shared address proofs uploaded. You need ${RULESET.sharedAddressProofsPerPerson} each for you and your partner, covering the ${RULESET.sharedAddressMonths} months before you apply.`)

  // Core paperwork.
  const missingCore = RULESET.coreDocumentIds.filter(
    (id) => !docs.some((d) => d.docTypeId === id && isDocumentAccepted(d)),
  )
  add('core-documents', missingCore.length === 0 ? 'pass' : 'fail',
    missingCore.length === 0
      ? 'All the main documents are uploaded and accepted.'
      : `Still needed: ${missingCore.map((id) => docTypeById(id)?.name ?? id).join(', ')}.`)

  // Things only you can confirm.
  for (const manual of RULESET.selfDeclaredRuleIds) {
    const ticked = !!stepOverrides[`rule:${manual}`]
    add(manual, ticked ? 'pass' : 'unknown',
      ticked ? 'You have confirmed this.' : 'Only you can confirm this. Tick it on the Next steps screen when it is true.')
  }

  const nextSteps = buildNextSteps(profile, docs, years, rules, stepOverrides)
  const points = rules.reduce((s, r) => s + (r.state === 'pass' ? 1 : r.state === 'unknown' ? 0.5 : 0), 0)
  const readinessPercent = Math.round((points / Math.max(1, rules.length)) * 100)

  return { applicationDate, years, rules, nextSteps, readinessPercent, overall: worst(rules.map((r) => r.state)) }
}

function labelForSpouseProof(v: Profile['spouseIrishCitizenshipProof']) {
  switch (v) {
    case 'irish-passport': return 'the photo page of their Irish passport'
    case 'naturalisation-cert': return 'their certificate of naturalisation'
    case 'foreign-birth-register': return 'their Foreign Births Register entry'
    case 'birth-cert': return 'their Irish birth certificate'
    default: return 'nothing chosen yet'
  }
}

function buildNextSteps(
  profile: Profile,
  docs: StoredDocument[],
  years: ResidenceYear[],
  rules: RuleOutcome[],
  overrides: Record<string, boolean>,
): NextStep[] {
  const steps: NextStep[] = []
  const push = (id: string, title: string, detail: string, priority: NextStep['priority']) => {
    steps.push({ id, title, detail, priority, done: !!overrides[id] })
  }

  if (!profile.applicantFullName || !profile.marriageDate || !profile.movedToIslandOn) {
    push('fill-profile', 'Finish your details',
      'Add your full name, your wedding date and the date you moved to the island of Ireland. Every check needs them.', 'blocker')
  }

  for (const r of rules) {
    if (r.state === 'fail') push(`fix:${r.ruleId}`, r.title, r.message, 'blocker')
  }

  for (const y of years) {
    if (y.evidenceRequired && y.proofState !== 'pass') {
      push(`proof:year${y.index}`, `Add proof of living here for Year ${y.index}`,
        `${formatLong(y.start)} to ${formatLong(y.end)}. ${y.proofMessage}`, 'important')
    }
  }

  for (const d of docs) {
    if (!d.userConfirmed && d.checks.some((c) => c.state !== 'pass')) {
      push(`review:${d.id}`, `Check "${d.fileName}"`,
        'The app could not confirm everything on this document. Open it, confirm it by hand, or upload a clearer scan.', 'important')
    }
  }

  for (const r of rules) {
    if (r.state === 'unknown') push(`confirm:${r.ruleId}`, r.title, r.message, 'nice-to-have')
  }

  for (const s of RULESET.standingSteps) push(s.id, s.title, s.detail, s.priority)

  const seen = new Set<string>()
  return steps.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
}

export { DOCUMENT_TYPES }
