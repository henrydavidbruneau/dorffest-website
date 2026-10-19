export interface DorfanzeigerOptionen {
  ressort?: MaybeRefOrGetter<Ressort | undefined>
  hervorgehoben?: boolean
  mitInterviews?: boolean
  limit?: number
}

export function useDorfanzeiger(optionen: DorfanzeigerOptionen = {}) {
  return useFetch<Artikel[]>('/api/dorfanzeiger', { query: optionen, default: () => [] })
}

export function useArtikel(slug: MaybeRefOrGetter<string>) {
  return useFetch<ArtikelDetail>(() => `/api/dorfanzeiger/${toValue(slug)}`)
}

export function usePortraets() {
  return useFetch<Portraet[]>('/api/portraets', { default: () => [] })
}
