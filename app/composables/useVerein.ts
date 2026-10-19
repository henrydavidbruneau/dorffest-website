import { VEREIN_STANDARD } from '#shared/utils/kontakt'
import type { Verein } from '#shared/types/verein'

/** Vereinsdaten (Kontakt-Mail, Konto, Infochannel) – gepflegt in Directus, einmal je Seite geladen */
export function useVerein() {
  const { data } = useFetch<Verein>('/api/verein', { key: 'verein', default: () => ({ ...VEREIN_STANDARD }) })
  return computed(() => data.value ?? { ...VEREIN_STANDARD })
}
