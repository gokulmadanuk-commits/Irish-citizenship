import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Absence, Profile, StoredDocument } from './types'
import {
  emptyProfile, loadAbsences, loadDocuments, loadProfile, loadStepOverrides,
  saveAbsences, saveDocuments, saveProfile, saveStepOverrides, deleteFile, wipeEverything,
} from './storage'
import { assess } from '../rules/engine'
import { toISO } from './dates'

export function useTracker() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [stepOverrides, setStepOverrides] = useState<Record<string, boolean>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [p, d, a, o] = await Promise.all([
        loadProfile(), loadDocuments(), loadAbsences(), loadStepOverrides(),
      ])
      setProfile(p); setDocuments(d); setAbsences(a); setStepOverrides(o); setReady(true)
    })()
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      void saveProfile(next)
      return next
    })
  }, [])

  const upsertDocument = useCallback((doc: StoredDocument) => {
    setDocuments((prev) => {
      const next = prev.some((d) => d.id === doc.id)
        ? prev.map((d) => (d.id === doc.id ? doc : d))
        : [...prev, doc]
      void saveDocuments(next)
      return next
    })
  }, [])

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id)
      void saveDocuments(next)
      void deleteFile(id)
      return next
    })
  }, [])

  const upsertAbsence = useCallback((a: Absence) => {
    setAbsences((prev) => {
      const next = prev.some((x) => x.id === a.id) ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a]
      next.sort((x, y) => x.departure.localeCompare(y.departure))
      void saveAbsences(next)
      return next
    })
  }, [])

  const removeAbsence = useCallback((id: string) => {
    setAbsences((prev) => {
      const next = prev.filter((a) => a.id !== id)
      void saveAbsences(next)
      return next
    })
  }, [])

  const toggleStep = useCallback((id: string, value: boolean) => {
    setStepOverrides((prev) => {
      const next = { ...prev, [id]: value }
      void saveStepOverrides(next)
      return next
    })
  }, [])

  const reset = useCallback(async () => {
    await wipeEverything()
    setProfile(emptyProfile); setDocuments([]); setAbsences([]); setStepOverrides({})
  }, [])

  const today = useMemo(() => toISO(new Date()), [])
  const assessment = useMemo(
    () => assess(profile, documents, absences, stepOverrides, today),
    [profile, documents, absences, stepOverrides, today],
  )

  return {
    ready, profile, documents, absences, stepOverrides, assessment, today,
    updateProfile, upsertDocument, removeDocument, upsertAbsence, removeAbsence, toggleStep, reset,
  }
}
