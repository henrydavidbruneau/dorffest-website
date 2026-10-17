export interface TermineOptionen {
  zeitraum?: 'kommend' | 'vergangen' | 'alle'
  hervorgehoben?: boolean
  mitDatum?: boolean
  limit?: number
}

export function useTermine(optionen: TermineOptionen = {}) {
  return useFetch<Termin[]>('/api/termine', { query: optionen, default: () => [] })
}

export function useTermin(slug: MaybeRefOrGetter<string>) {
  return useFetch<Termin>(() => `/api/termine/${toValue(slug)}`)
}
