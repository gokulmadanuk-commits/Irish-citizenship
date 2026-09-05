// Runs each acceptance test for a document against the text we pulled out of it.
import type { CheckResult, CheckState, Criterion, Profile, StoredDocument } from '../lib/types'
import { containsAddress, containsAnyKeyword, containsPersonName, findDates, hasIslandOfIrelandAddress } from '../lib/textscan'
import { docTypeById } from './documents'
import { toDate } from '../lib/dates'

export function runChecks(doc: StoredDocument, profile: Profile): CheckResult[] {
  const type = docTypeById(doc.docTypeId)
  if (!type) return []
  const text = doc.ocrText ?? ''
  const readable = text.trim().length > 30

  return type.acceptanceCriteria.map((c) => evaluate(c, doc, profile, text, readable))
}

function evaluate(
  c: Criterion, doc: StoredDocument, profile: Profile, text: string, readable: boolean,
): CheckResult {
  const mk = (state: CheckState, evidence: string): CheckResult =>
    ({ criterionId: c.id, label: c.label, state, evidence })

  if (!c.autoTest) return mk('unknown', 'You need to check this one yourself.')
  if (!readable) return mk('unknown', 'The app could not read enough text from this file. Check it by hand.')

  switch (c.autoTest.kind) {
    case 'containsApplicantName': {
      if (!profile.applicantFullName) return mk('unknown', 'Add your full name in Your details first.')
      return containsPersonName(text, profile.applicantFullName)
        ? mk('pass', 'Your name appears on the document.')
        : mk('fail', 'Your name was not found on the document.')
    }
    case 'containsAddress': {
      const onIsland = hasIslandOfIrelandAddress(text)
      if (profile.currentAddress && containsAddress(text, profile.currentAddress)) {
        return mk('pass', 'Your saved address appears on the document.')
      }
      if (onIsland) return mk('unknown', 'A Northern Ireland or Irish postcode was found, but not your saved address. Check it.')
      return mk('fail', 'No address on the island of Ireland was found on this document.')
    }
    case 'containsAnyKeyword': {
      const kws = c.autoTest.keywords
      return containsAnyKeyword(text, kws)
        ? mk('pass', 'The document has the wording we expect.')
        : mk('unknown', `Could not find any of: ${kws.slice(0, 6).join(', ')}. Check by hand.`)
    }
    case 'hasAnyDate': {
      return findDates(text).length > 0
        ? mk('pass', 'The document is dated.')
        : mk('fail', 'No date was found on this document.')
    }
    case 'hasDateInCoveredPeriod': {
      if (!doc.coversFrom || !doc.coversTo) return mk('unknown', 'Set the dates this document covers.')
      const from = toDate(doc.coversFrom).getTime()
      const to = toDate(doc.coversTo).getTime()
      const hit = findDates(text).find((d) => {
        const t = toDate(d.iso).getTime()
        return t >= from && t <= to
      })
      return hit
        ? mk('pass', `Found the date ${hit.raw} inside the period you set.`)
        : mk('fail', 'No date inside the period you set was found on this document.')
    }
  }
}

export function documentState(doc: StoredDocument): CheckState {
  if (doc.userConfirmed && !doc.checks.some((c) => c.state === 'fail')) return 'pass'
  if (!doc.checks.length) return 'unknown'
  if (doc.checks.some((c) => c.state === 'fail')) return 'fail'
  if (doc.checks.some((c) => c.state === 'unknown')) return 'unknown'
  return 'pass'
}
