// Proof that you and your partner share a home.
// The Department's words: "three different documents for both you and your partner
// that show you lived at the same address for the 3 months leading up to your
// application." So each of you needs three different kinds of document, all at the
// same address, all from the three months before you apply. A joint document, with
// both names on it, counts for both of you.
import type { CheckState, Holder, Profile, SharedProofKind, StoredDocument } from '../lib/types'
import { addMonths, documentOverlapDays } from '../lib/dates'
import { RULESET } from './ruleset'

export const SHARED_PROOF_KINDS: Array<{ id: SharedProofKind; label: string }> = [
  { id: 'bank-statement', label: 'Bank statement' },
  { id: 'credit-card-statement', label: 'Credit card statement' },
  { id: 'utility-bill', label: 'Gas, electricity or water bill' },
  { id: 'phone-or-broadband', label: 'Phone, broadband or TV bill' },
  { id: 'tv-licence', label: 'TV licence' },
  { id: 'tenancy-or-mortgage', label: 'Tenancy agreement or mortgage statement' },
  { id: 'rates-bill', label: 'Rates bill' },
  { id: 'employer-letter', label: 'Letter from an employer' },
  { id: 'hmrc-or-benefits-letter', label: 'HMRC or benefits letter' },
  { id: 'gp-or-hospital-letter', label: 'GP or hospital letter' },
  { id: 'other', label: 'Something else' },
]

export function kindLabel(kind: SharedProofKind | undefined): string {
  return SHARED_PROOF_KINDS.find((k) => k.id === kind)?.label ?? 'Not set'
}

export function partnerFirstName(profile: Profile): string {
  return profile.spouseFullName.trim().split(/\s+/)[0] || 'your partner'
}

export function holderLabel(holder: Holder | undefined, profile: Profile): string {
  if (holder === 'me') return 'You'
  if (holder === 'partner') return partnerFirstName(profile)
  if (holder === 'both') return 'Both of you'
  return 'Not set'
}

export interface PersonCover {
  /** The different kinds of document that count for this person. */
  kinds: SharedProofKind[]
  needed: number
  met: boolean
}

export interface SharedHomeStatus {
  state: CheckState
  message: string
  windowStart: string
  windowEnd: string
  me: PersonCover
  partner: PersonCover
  /** Documents the app cannot place yet: no owner, no kind, or no dates. */
  incompleteIds: string[]
  /** Documents dated outside the three months before you apply. */
  outOfWindowIds: string[]
  /** Documents that count, but still need certifying. */
  uncertifiedIds: string[]
  countedIds: string[]
}

export function sharedHomeStatus(
  docs: StoredDocument[],
  profile: Profile,
  applicationDate: string,
  isAccepted: (d: StoredDocument) => boolean,
  needsCertifying: (d: StoredDocument) => boolean,
): SharedHomeStatus {
  const needed = RULESET.sharedAddressProofsPerPerson
  const windowEnd = applicationDate
  const windowStart = addMonths(applicationDate, -RULESET.sharedAddressMonths)

  const own = docs.filter((d) => d.docTypeId === RULESET.sharedAddressDocId && isAccepted(d))
  const incomplete = own.filter((d) => !d.holder || !d.proofKind || !d.coversFrom || !d.coversTo)
  const placed = own.filter((d) => !incomplete.includes(d))
  const outOfWindow = placed.filter((d) => documentOverlapDays(d.coversFrom, d.coversTo, windowStart, windowEnd) <= 0)
  const counted = placed.filter((d) => !outOfWindow.includes(d))

  const coverFor = (who: 'me' | 'partner'): PersonCover => {
    const kinds: SharedProofKind[] = []
    for (const d of counted) {
      if (d.holder !== who && d.holder !== 'both') continue
      // "Something else" cannot be compared, so each one counts as its own kind.
      if (d.proofKind === 'other' || !kinds.includes(d.proofKind!)) kinds.push(d.proofKind!)
    }
    return { kinds, needed, met: kinds.length >= needed }
  }
  const me = coverFor('me')
  const partner = coverFor('partner')
  const uncertified = counted.filter(needsCertifying)
  const name = partnerFirstName(profile)

  const line = (who: string, c: PersonCover) =>
    `${who}: ${Math.min(c.kinds.length, needed)} of ${needed} different kinds${c.kinds.length ? ` (${c.kinds.map(kindLabel).join(', ').toLowerCase()})` : ''}.`
  const parts = [line('You', me), line(name, partner)]
  if (incomplete.length) {
    parts.push(`${incomplete.length} document${incomplete.length === 1 ? ' needs' : 's need'} whose name is on it, what kind it is, and its dates.`)
  }
  if (outOfWindow.length) {
    parts.push(`${outOfWindow.length} ${outOfWindow.length === 1 ? 'is' : 'are'} dated outside the 3 months before you apply, so ${outOfWindow.length === 1 ? 'it does' : 'they do'} not count.`)
  }
  if (me.met && partner.met && uncertified.length) {
    parts.push(`You have the right documents. ${uncertified.length} still need${uncertified.length === 1 ? 's' : ''} certifying.`)
  }

  let state: CheckState
  if (me.met && partner.met) state = uncertified.length ? 'uncertified' : 'pass'
  else state = incomplete.length ? 'unknown' : 'fail'

  return {
    state,
    message: parts.join(' '),
    windowStart,
    windowEnd,
    me,
    partner,
    incompleteIds: incomplete.map((d) => d.id),
    outOfWindowIds: outOfWindow.map((d) => d.id),
    uncertifiedIds: uncertified.map((d) => d.id),
    countedIds: counted.map((d) => d.id),
  }
}
