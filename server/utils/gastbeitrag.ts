// Gastbeiträge über private Links: Directus `gastbeitrag_einladungen` (lesen per Schlüssel,
// Status auf `eingereicht` setzen) und `gastbeitraege` (nur anlegen).
import type { GastbeitragEinladung, GastbeitragEinladungOeffentlich } from '#shared/types/gastbeitrag'

type EinladungRoh = Omit<GastbeitragEinladung, 'ressort'> & { ressort: { slug: Ressort } | null }

/** Einladung zum Schlüssel; widerrufene oder unbekannte Links gibt es nicht */
export async function ladeEinladung(schluessel: string): Promise<GastbeitragEinladung | null> {
  if (!/^[\w-]{6,64}$/.test(schluessel)) return null
  const [roh] = await directusListe<EinladungRoh>('gastbeitrag_einladungen', {
    fields: 'id,status,schluessel,name,ressort.slug,gueltig_bis,mehrfach,date_created',
    filter: { schluessel: { _eq: schluessel }, status: { _neq: 'widerrufen' } },
    limit: 1,
  })
  return roh ? { ...roh, ressort: roh.ressort?.slug ?? null } : null
}

/** Nach dem ersten Beitrag ist ein einfacher Link verbraucht */
export async function markiereEingereicht(einladung: GastbeitragEinladung) {
  if (einladung.mehrfach || einladung.status !== 'offen') return
  await directusServer(`/items/gastbeitrag_einladungen/${einladung.id}`, { method: 'PATCH', body: { status: 'eingereicht' } })
}

/** Ressort-Slug → ID (Gastbeiträge speichern die Relation) */
export async function ressortId(slug: Ressort): Promise<number | null> {
  const [ressort] = await directusListe<{ id: number }>('ressorts', { fields: 'id', filter: { slug: { _eq: slug } }, limit: 1 })
  return ressort?.id ?? null
}

export function oeffentlicheEinladung(e: GastbeitragEinladung): GastbeitragEinladungOeffentlich {
  // gueltig_bis ist ein Datum: gilt bis Ende des Tages
  const abgelaufen = !!e.gueltig_bis && Date.parse(`${e.gueltig_bis.slice(0, 10)}T23:59:59+01:00`) < Date.now()
  const eingereicht = e.status === 'eingereicht' && !e.mehrfach
  return {
    name: e.name,
    ressort: e.ressort,
    gueltig: !abgelaufen && !eingereicht,
    grund: eingereicht ? 'eingereicht' : abgelaufen ? 'abgelaufen' : null,
  }
}
