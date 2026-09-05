// The rules engine. Pure logic: give it your details and it tells you where you stand.
// Every number it uses comes from the ruleset file, so the law and the code stay separate.
import {
  addDays, addYears, daysBetween, absenceDaysInWindow, formatLong, isAfter, isBefore, overlapDays,
} from '../lib/dates'
import type {
  Absence, Assessment, CheckState, NextStep, Profile, ResidenceYear, RuleOutcome, StoredDocument,
} from '../lib/types'
import { RULESET } from './ruleset'
import { DOCUMENT_TYPES, docTypeById } from './documents'

const worst = (states: CheckState[]): CheckState =>
  states.includes('fail') ? 'fail' : states.includes('unknown') ? 'unknown' : 'pass'

export function buildYears(applicationDate: string, absences: Absence[], docs: StoredDocument[]): ResidenceYear[] {
  const years: ResidenceYear[] = []
  const n = RULESET.residenceYearsRequired
  for (let i = 1; i <= n; i++) {
    const end = addYears(applicationDate, -(i - 1))
    const start = addYears(applicationDate, -i)
    const daysInWindow = daysBetween(start, end)

    const daysAbsent = absences
      .filter((a) => a.countsAsAbsence && a.departure && a.ret)
      .reduce((sum, a) => sum + absenceDaysInWindow(a.departure, a.ret, start, end), 0)

    const limit = i === 1 ? RULESET.finalYearAbsenceLimitDays : null
    let absenceState: CheckState = 'pass'
    if (limit !== null && daysAbsent > limit) absenceState = 'fail'
    else if (limit !== null && daysAbsent > limit - 14) absenceState = 'unknown'

    const proofDocs = docs.filter((d) => {
      const t = docTypeById(d.docTypeId)
      if (!t?.isResidenceProof) return false
      if (!d.coversFrom || !d.coversTo) return false
      if (!isDocumentAccepted(d)) return false
      return overlapDays(d.coversFrom, d.coversTo, start, end) > 0
    })

    const { state: proofState, message: proofMessage } = judgeProofCover(proofDocs, start, end)

    years.push({
      index: i,
      label: i === 1 ? 'Year 1 (the 12 months just before you apply)' : `Year ${i}`,
      start,
      end,
      daysInWindow,
      daysAbsent,
      daysPresent: daysInWindow - daysAbsent,
      absenceLimit: limit,
      absenceState,
      proofDocumentIds: proofDocs.map((d) => d.id),
      proofState,
      proofMessage,
    })
  }
  return years
}

/** A document counts once every criterion either passes or the user has confirmed it by hand. */
export function isDocumentAccepted(doc: StoredDocument): boolean {
  if (doc.userConfirmed) return !doc.checks.some((c) => c.state === 'fail')
  return doc.checks.length > 0 && doc.checks.every((c) => c.state === 'pass')
}

function judgeProofCover(docs: StoredDocument[], start: string, end: string) {
  const need = RULESET.proofsPerYear
  if (docs.length === 0) {
    return { state: 'fail' as CheckState, message: `No accepted proof of residence yet. You need at least ${need} for this year.` }
  }
  const segments = RULESET.proofSegmentsPerYear
  const segLen = daysBetween(start, end) / segments
  const covered = new Set<number>()
  for (const d of docs) {
    for (let s = 0; s < segments; s++) {
      const segStart = addDays(start, Math.round(s * segLen))
      const segEnd = addDays(start, Math.round((s + 1) * segLen))
      if (overlapDays(d.coversFrom, d.coversTo, segStart, segEnd) > 0) covered.add(s)
    }
  }
  if (docs.length < need) {
    return { state: 'fail' as CheckState, message: `${docs.length} of ${need} accepted proofs for this year.` }
  }
  if (covered.size < segments) {
    return {
      state: 'unknown' as CheckState,
      message: `You have ${docs.length} proofs, but they cover only ${covered.size} of ${segments} parts of the year. Add one from the gap.`,
    }
  }
  return { state: 'pass' as CheckState, message: `${docs.length} accepted proofs, spread across the whole year.` }
}

export function assess(
  profile: Profile,
  docs: StoredDocument[],
  absences: Absence[],
  stepOverrides: Record<string, boolean>,
  today: string,
): Assessment {
  const applicationDate = profile.plannedApplicationDate || today
  const years = buildYears(applicationDate, absences, docs)
  const rules: RuleOutcome[] = []

  const add = (
    ruleId: string, state: CheckState, message: string,
  ) => {
    const meta = RULESET.rules.find((r) => r.id === ruleId)
    if (!meta) return
    rules.push({
      ruleId,
      title: meta.title,
      plainEnglish: meta.plainEnglish,
      legalBasis: meta.legalBasis,
      sources: meta.sources,
      state,
      message,
    })
  }

  // 1. Married to an Irish citizen for long enough.
  if (!profile.marriageDate) {
    add('marriage-duration', 'unknown', 'Add your wedding date to check this.')
  } else {
    const yearsMarried = daysBetween(profile.marriageDate, applicationDate) / 365.25
    const needed = RULESET.marriageYearsRequired
    const eligibleOn = addYears(profile.marriageDate, needed)
    if (!isBefore(eligibleOn, applicationDate) && eligibleOn !== applicationDate) {
      add('marriage-duration', 'fail',
        `You must be married for ${needed} years. You reach that on ${formatLong(eligibleOn)}.`)
    } else {
      add('marriage-duration', 'pass',
        `Married ${yearsMarried.toFixed(1)} years by ${formatLong(applicationDate)}. The rule is ${needed}.`)
    }
  }

  // 2. Marriage is real and you live together.
  add('marriage-subsisting', profile.livingTogether ? 'pass' : 'fail',
    profile.livingTogether
      ? 'You have said the marriage is ongoing and you live together.'
      : 'You must be living together as a married couple when you apply.')

  // 3. Spouse is an Irish citizen and you can prove it.
  add('spouse-irish',
    profile.spouseIrishCitizenshipProof === 'none' ? 'fail' : 'pass',
    profile.spouseIrishCitizenshipProof === 'none'
      ? 'Choose how you will prove your husband or wife is an Irish citizen.'
      : `You will prove it with: ${labelForSpouseProof(profile.spouseIrishCitizenshipProof)}.`)

  // 4. Total residence on the island of Ireland.
  const totalPresent = years.reduce((s, y) => s + y.daysPresent, 0)
  const totalNeeded = RULESET.totalReckonableDaysRequired
  add('total-residence',
    totalPresent >= totalNeeded ? 'pass' : 'fail',
    `${totalPresent} days on the island of Ireland across the last ${RULESET.residenceYearsRequired} years. You need ${totalNeeded}.`)

  // 5. Continuous residence in the final year.
  const y1 = years[0]
  add('continuous-final-year',
    y1.absenceState,
    y1.absenceState === 'fail'
      ? `You were away ${y1.daysAbsent} days in the final year. The limit is ${RULESET.finalYearAbsenceLimitDays}.`
      : y1.absenceState === 'unknown'
        ? `You were away ${y1.daysAbsent} days in the final year. You are close to the ${RULESET.finalYearAbsenceLimitDays} day limit.`
        : `You were away ${y1.daysAbsent} days in the final year. The limit is ${RULESET.finalYearAbsenceLimitDays}.`)

  // 6. Residence started early enough.
  if (profile.movedToIslandOn) {
    const earliest = addYears(profile.movedToIslandOn, RULESET.residenceYearsRequired)
    add('residence-start',
      isAfter(applicationDate, earliest) || applicationDate === earliest ? 'pass' : 'fail',
      isAfter(applicationDate, earliest) || applicationDate === earliest
        ? `You arrived on ${formatLong(profile.movedToIslandOn)}, so the earliest you can apply is ${formatLong(earliest)}.`
        : `You arrived on ${formatLong(profile.movedToIslandOn)}. The earliest you can apply is ${formatLong(earliest)}.`)
  } else {
    add('residence-start', 'unknown', 'Add the date you moved to Northern Ireland or Ireland.')
  }

  // 7. Proof of residence for each year.
  add('residence-evidence', worst(years.map((y) => y.proofState)),
    years.map((y) => `Year ${y.index}: ${y.proofMessage}`).join(' '))

  // 8. Core paperwork.
  const missingCore = RULESET.coreDocumentIds.filter(
    (id) => !docs.some((d) => d.docTypeId === id && isDocumentAccepted(d)),
  )
  add('core-documents',
    missingCore.length === 0 ? 'pass' : 'fail',
    missingCore.length === 0
      ? 'All the main documents are uploaded and accepted.'
      : `Still needed: ${missingCore.map((id) => docTypeById(id)?.name ?? id).join(', ')}.`)

  // 9 and 10. Things the app cannot judge for you.
  for (const manual of RULESET.selfDeclaredRuleIds) {
    add(manual, stepOverrides[`rule:${manual}`] ? 'pass' : 'unknown',
      stepOverrides[`rule:${manual}`] ? 'You have confirmed this.' : 'Only you can confirm this. Tick it when it is true.')
  }

  const nextSteps = buildNextSteps(profile, docs, years, rules, stepOverrides)
  const scored = rules.filter((r) => r.state !== 'unknown' || true)
  const points = rules.reduce((s, r) => s + (r.state === 'pass' ? 1 : r.state === 'unknown' ? 0.5 : 0), 0)
  const readinessPercent = Math.round((points / Math.max(1, scored.length)) * 100)

  return {
    applicationDate,
    years,
    rules,
    nextSteps,
    readinessPercent,
    overall: worst(rules.map((r) => r.state)),
  }
}

function labelForSpouseProof(v: Profile['spouseIrishCitizenshipProof']) {
  switch (v) {
    case 'irish-passport': return 'their Irish passport'
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
      'Add your full name, your wedding date and the date you moved to the island of Ireland. The checks need them.', 'blocker')
  }

  for (const r of rules) {
    if (r.state === 'fail') {
      push(`fix:${r.ruleId}`, r.title, r.message, 'blocker')
    }
  }

  for (const y of years) {
    if (y.proofState !== 'pass') {
      push(`proof:year${y.index}`, `Add proof of living here for Year ${y.index}`,
        `${formatLong(y.start)} to ${formatLong(y.end)}. ${y.proofMessage}`, 'important')
    }
  }

  const pending = docs.filter((d) => d.checks.some((c) => c.state !== 'pass') && !d.userConfirmed)
  for (const d of pending) {
    push(`review:${d.id}`, `Check "${d.fileName}"`,
      'The app could not confirm everything on this document. Open it and confirm by hand, or upload a clearer scan.', 'important')
  }

  for (const r of rules) {
    if (r.state === 'unknown' && !r.ruleId.startsWith('fix')) {
      push(`confirm:${r.ruleId}`, r.title, r.message, 'nice-to-have')
    }
  }

  for (const s of RULESET.standingSteps) {
    push(s.id, s.title, s.detail, s.priority)
  }

  const seen = new Set<string>()
  return steps.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
}

export { DOCUMENT_TYPES }
