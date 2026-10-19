// Vereinsdaten (Kontakt, Konto, Infochannel) aus dem Directus-Singleton `verein`.
// Kurz zwischengespeichert; ohne Directus gelten die Ersatzwerte aus shared/utils/kontakt.ts.
import { VEREIN_STANDARD } from '#shared/utils/kontakt'
import type { Verein } from '#shared/types/verein'

let zwischenspeicher: { bis: number, verein: Verein } | null = null

export async function ladeVerein(): Promise<Verein> {
  if (zwischenspeicher && zwischenspeicher.bis > Date.now()) return zwischenspeicher.verein
  const roh = await directusServer<Partial<Verein> | null>('/items/verein', {
    query: { fields: 'kontakt_email,kontoinhaber,iban,infochannel_url,naechstes_dorffest' },
  }).catch(() => null)
  const verein = Object.fromEntries(Object.entries(VEREIN_STANDARD)
    .map(([k, standard]) => [k, (roh as Record<string, unknown> | null)?.[k] || standard])) as unknown as Verein
  zwischenspeicher = { bis: Date.now() + 5 * 60 * 1000, verein }
  return verein
}
