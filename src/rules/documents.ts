// PLACEHOLDER - replaced with the verified research output.
import type { DocumentType } from '../lib/types'

export const DOCUMENT_TYPES: DocumentType[] = []

const byId = new Map(DOCUMENT_TYPES.map((d) => [d.docId, d]))
export function docTypeById(id: string): DocumentType | undefined {
  return byId.get(id)
}
