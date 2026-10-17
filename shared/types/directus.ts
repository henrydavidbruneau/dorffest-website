// Felder, die jede Directus-Collection mitbringt
export type DirectusStatus = 'published' | 'draft' | 'archived'

export interface DirectusEintrag {
  id: number
  status: DirectusStatus
  date_created: string
  date_updated: string | null
}
