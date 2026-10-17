export interface DorfanzeigerOptionen {
  ressort?: MaybeRefOrGetter<Ressort | undefined>
  ausgabe?: MaybeRefOrGetter<number | undefined>
  hervorgehoben?: boolean
  limit?: number
}

export function useDorfanzeiger(optionen: DorfanzeigerOptionen = {}) {
  return useFetch<Artikel[]>('/api/dorfanzeiger', { query: optionen, default: () => [] })
}

export function useArtikel(slug: MaybeRefOrGetter<string>) {
  return useFetch<Artikel>(() => `/api/dorfanzeiger/${toValue(slug)}`)
}

export function useAusgaben() {
  return useFetch<Ausgabe[]>('/api/ausgaben', { default: () => [] })
}

export function usePortraets(ausgabe?: MaybeRefOrGetter<number | undefined>) {
  return useFetch<Portraet[]>('/api/portraets', { query: { ausgabe }, default: () => [] })
}
