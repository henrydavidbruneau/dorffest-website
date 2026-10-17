export function useKleinanzeigen(limit?: number) {
  return useFetch<Kleinanzeige[]>('/api/kleinanzeigen', { query: { limit }, default: () => [] })
}
