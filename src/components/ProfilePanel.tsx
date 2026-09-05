import type { Profile } from '../lib/types'
import { Card, Field, inputClass } from './ui'

export function ProfilePanel({ profile, onChange }: {
  profile: Profile; onChange: (patch: Partial<Profile>) => void
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="About you" subtitle="These details drive every check. Fill them in first.">
        <div className="grid gap-4">
          <Field label="Your full name" hint="Write it exactly as it appears on your passport.">
            <input className={inputClass} value={profile.applicantFullName}
              onChange={(e) => onChange({ applicantFullName: e.target.value })} placeholder="e.g. Anna Maria Silva" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth">
              <input type="date" className={inputClass} value={profile.dateOfBirth}
                onChange={(e) => onChange({ dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Your nationality">
              <input className={inputClass} value={profile.nationality}
                onChange={(e) => onChange({ nationality: e.target.value })} placeholder="e.g. Indian" />
            </Field>
          </div>
          <Field label="Your address" hint="The app looks for this address on your documents.">
            <textarea className={inputClass} rows={3} value={profile.currentAddress}
              onChange={(e) => onChange({ currentAddress: e.target.value })}
              placeholder={'12 Example Road\nBelfast\nBT1 1AA'} />
          </Field>
          <Field label="Your UK immigration status" hint="For example: spouse visa valid to 12/2027.">
            <input className={inputClass} value={profile.ukImmigrationStatus}
              onChange={(e) => onChange({ ukImmigrationStatus: e.target.value })}
              placeholder="UK spouse visa" />
          </Field>
        </div>
      </Card>

      <Card title="Your marriage and your dates" subtitle="The clock for this route starts with these.">
        <div className="grid gap-4">
          <Field label="Your husband or wife's full name">
            <input className={inputClass} value={profile.spouseFullName}
              onChange={(e) => onChange({ spouseFullName: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Wedding date">
              <input type="date" className={inputClass} value={profile.marriageDate}
                onChange={(e) => onChange({ marriageDate: e.target.value })} />
            </Field>
            <Field label="Date you moved to the island of Ireland" hint="Northern Ireland counts.">
              <input type="date" className={inputClass} value={profile.movedToIslandOn}
                onChange={(e) => onChange({ movedToIslandOn: e.target.value })} />
            </Field>
          </div>
          <Field label="How you will prove your partner is an Irish citizen">
            <select className={inputClass} value={profile.spouseIrishCitizenshipProof}
              onChange={(e) => onChange({ spouseIrishCitizenshipProof: e.target.value as Profile['spouseIrishCitizenshipProof'] })}>
              <option value="none">Not chosen yet</option>
              <option value="irish-passport">Irish passport</option>
              <option value="birth-cert">Irish birth certificate</option>
              <option value="naturalisation-cert">Certificate of naturalisation</option>
              <option value="foreign-birth-register">Foreign Births Register entry</option>
            </select>
          </Field>
          <Field label="Planned application date" hint="Leave blank to use today. Change it to test a future date.">
            <input type="date" className={inputClass} value={profile.plannedApplicationDate}
              onChange={(e) => onChange({ plannedApplicationDate: e.target.value })} />
          </Field>
          <label className="flex items-start gap-3 rounded-lg bg-ink-50 p-3">
            <input type="checkbox" className="mt-0.5 size-4 accent-[color:var(--color-shamrock-600)]"
              checked={profile.livingTogether}
              onChange={(e) => onChange({ livingTogether: e.target.checked })} />
            <span className="text-sm text-ink-800">
              We are still married and living together as a couple.
            </span>
          </label>
        </div>
      </Card>
    </div>
  )
}
