// Gastbeiträge über private Links. Heute aus server/data, später Directus
// `gastbeitrag_einladungen` (lesen per Schlüssel) und `gastbeitraege` (nur anlegen).
import type { GastbeitragEinladung, GastbeitragEinladungOeffentlich } from '#shared/types/gastbeitrag'
import { gastbeitragEinladungen } from '../data/gastbeitraege'

/** Einladung zum Schlüssel; widerrufene oder unbekannte Links gibt es nicht */
export async function ladeEinladung(schluessel: string): Promise<GastbeitragEinladung | null> {
  if (!/^[\w-]{6,64}$/.test(schluessel)) return null
  const einladung = gastbeitragEinladungen.find(e => e.schluessel === schluessel)
  return einladung && einladung.status !== 'widerrufen' ? einladung : null
}

export function oeffentlicheEinladung(e: GastbeitragEinladung): GastbeitragEinladungOeffentlich {
  const abgelaufen = !!e.gueltig_bis && Date.parse(e.gueltig_bis) < Date.now()
  const eingereicht = e.status === 'eingereicht' && !e.mehrfach
  return {
    name: e.name,
    ressort: e.ressort,
    gueltig: !abgelaufen && !eingereicht,
    grund: eingereicht ? 'eingereicht' : abgelaufen ? 'abgelaufen' : null,
  }
}
