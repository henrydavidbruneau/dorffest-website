export interface DorfanzeigerOptionen {
  ressort?: MaybeRefOrGetter<Ressort | undefined>
  hervorgehoben?: boolean
  limit?: number
}

export function useDorfanzeiger(optionen: DorfanzeigerOptionen = {}) {
  return useFetch<Artikel[]>('/api/dorfanzeiger', { query: optionen, default: () => [] })
}

export function useArtikel(slug: MaybeRefOrGetter<string>) {
  return useFetch<Artikel>(() => `/api/dorfanzeiger/${toValue(slug)}`)
}
