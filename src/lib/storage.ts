// All data stays on this device, in the browser's own database (IndexedDB).
import { get, set, del, createStore } from 'idb-keyval'
import type { Absence, Profile, StoredDocument } from './types'

const store = createStore('irish-citizenship', 'kv')
const fileStore = createStore('irish-citizenship-files', 'files')

const PROFILE_KEY = 'profile'
const DOCS_KEY = 'documents'
const ABSENCES_KEY = 'absences'
const STEPS_KEY = 'step-overrides'

export const emptyProfile: Profile = {
  applicantFullName: '',
  dateOfBirth: '',
  nationality: '',
  currentAddress: '',
  movedToIslandOn: '',
  marriageDate: '',
  spouseFullName: '',
  spouseIrishCitizenshipProof: 'none',
  livingTogether: true,
  ukImmigrationStatus: '',
  plannedApplicationDate: '',
}

export async function loadProfile(): Promise<Profile> {
  return (await get<Profile>(PROFILE_KEY, store)) ?? emptyProfile
}
export async function saveProfile(p: Profile) {
  await set(PROFILE_KEY, p, store)
}

export async function loadDocuments(): Promise<StoredDocument[]> {
  return (await get<StoredDocument[]>(DOCS_KEY, store)) ?? []
}
export async function saveDocuments(docs: StoredDocument[]) {
  await set(DOCS_KEY, docs, store)
}

export async function loadAbsences(): Promise<Absence[]> {
  return (await get<Absence[]>(ABSENCES_KEY, store)) ?? []
}
export async function saveAbsences(a: Absence[]) {
  await set(ABSENCES_KEY, a, store)
}

export async function loadStepOverrides(): Promise<Record<string, boolean>> {
  return (await get<Record<string, boolean>>(STEPS_KEY, store)) ?? {}
}
export async function saveStepOverrides(o: Record<string, boolean>) {
  await set(STEPS_KEY, o, store)
}

export async function saveFile(id: string, file: Blob) {
  await set(id, file, fileStore)
}
export async function loadFile(id: string): Promise<Blob | undefined> {
  return await get<Blob>(id, fileStore)
}
export async function deleteFile(id: string) {
  await del(id, fileStore)
}

export async function wipeEverything() {
  await Promise.all([
    del(PROFILE_KEY, store),
    del(DOCS_KEY, store),
    del(ABSENCES_KEY, store),
    del(STEPS_KEY, store),
  ])
  const docs = await loadDocuments()
  await Promise.all(docs.map((d) => deleteFile(d.id)))
}
