// Lesezugriff auf Termine aus Directus (`termine`, Anmeldezahlen aus `anmeldungen`).
// Nur diese Datei kennt Directus – Routen, Composables und Seiten bleiben gleich.

export interface TerminFilter {
  zeitraum?: 'kommend' | 'vergangen' | 'alle'
  hervorgehoben?: boolean
  /** nur den Termin fürs Nextup-Band (`im_fokus`) */
  fokus?: boolean
  /** nur Termine mit festem Datum oder Rhythmus (für den Terminkalender) */
  mitDatum?: boolean
  limit?: number
}

/** Ein Termin gilt bis zu seinem Ende (oder Beginn + 1 Tag) als kommend. Ohne Datum immer. */
export function istKommend(termin: Termin, jetzt: number) {
  if (!termin.beginn) return true
  const ende = termin.ende ? Date.parse(termin.ende) : Date.parse(termin.beginn) + 24 * 60 * 60 * 1000
  return ende >= jetzt
}

const wiederholt = (t: Termin) => !!t.wiederholung && t.wiederholung !== 'aus'

/** aufsteigend nach Beginn (regelmäßige mit ihrem nächsten Datum); alte Rhythmus-Termine ohne
 *  echte Wiederholung danach, Termine ohne Datum ans Ende */
function nachBeginn(a: Termin, b: Termin) {
  const rang = (t: Termin) => (!t.beginn ? 2 : t.rhythmus_kurz && !wiederholt(t) ? 1 : 0)
  if (rang(a) !== rang(b)) return rang(a) - rang(b)
  return Date.parse(a.beginn ?? '') - Date.parse(b.beginn ?? '') || 0
}

// Ausdrücklich ohne den Alias `anmeldungen` (O2M) – die liest der Server-Token nicht
const FELDER = [
  'id', 'status', 'date_created', 'date_updated', 'titel', 'slug', 'beginn', 'ende', 'uhrzeit_folgt',
  'datum_text', 'rhythmus_kurz', 'hinweis', 'ort', 'adresse', 'bild', 'bild_alt', 'kurzbeschreibung',
  'beschreibung', 'aufruf_text', 'hervorgehoben', 'anmeldung_aktiv', 'plaetze', 'mitbringen_position',
  'mitbringen_text', 'mitbringen_vorschlaege',
].join(',')
// neuere Felder – fehlen sie in Directus noch, wird ohne sie gelesen
const FELDER_WIEDERHOLUNG = `${FELDER},wiederholung,wiederholung_bis,im_fokus,mitbringen_frage`

// Solange `wiederholung` in Directus noch nicht angelegt ist (scripts/directus-setup.mjs), ohne lesen
let mitWiederholung = true
async function leseTermine(abfrage: Record<string, unknown>): Promise<Termin[]> {
  if (mitWiederholung) {
    try {
      return await directusListe<Termin>('termine', { ...abfrage, fields: FELDER_WIEDERHOLUNG })
    }
    catch (e) {
      console.warn('[termine] ohne Wiederholung gelesen (Feld fehlt?):', (e as Error)?.message ?? e)
      mitWiederholung = false
    }
  }
  return directusListe<Termin>('termine', { ...abfrage, fields: FELDER })
}

/** Regelmäßige Termine: `beginn`/`ende` auf das nächste Datum setzen, Kurzform ergänzen */
function aufNaechstesDatum(t: Termin, jetzt: number): Termin {
  if (!wiederholt(t)) return t
  const naechstes = naechstesVorkommen(t, jetzt)
  return {
    ...t,
    beginn: naechstes?.beginn ?? t.beginn,
    ende: naechstes?.ende ?? t.ende,
    rhythmus_kurz: t.rhythmus_kurz || wiederholungKurz(t.wiederholung, t.beginn) || null,
  }
}

export async function ladeTermine(filter: TerminFilter = {}): Promise<Termin[]> {
  const jetzt = Date.now()
  const zeitraum = filter.zeitraum ?? 'kommend'
  const bedingungen: object[] = [VEROEFFENTLICHT]
  if (filter.hervorgehoben) bedingungen.push({ hervorgehoben: { _eq: true } })
  if (filter.fokus) {
    if (!mitWiederholung) return [] // Feld fehlt noch
    bedingungen.push({ im_fokus: { _eq: true } })
  }
  if (filter.mitDatum) bedingungen.push({ beginn: { _nnull: true } })
  // Nextup-Abfrage darf nie die Startseite kippen (z.B. solange `im_fokus` in Directus fehlt)
  const roh = filter.fokus
    ? await leseTermine({ filter: { _and: bedingungen } }).catch(() => [])
    : await leseTermine({ filter: { _and: bedingungen } })
  let liste = roh.map(t => aufNaechstesDatum(t, jetzt))
  if (zeitraum === 'kommend') liste = liste.filter(t => istKommend(t, jetzt)).sort(nachBeginn)
  if (zeitraum === 'vergangen') liste = liste.filter(t => !istKommend(t, jetzt)).sort((a, b) => nachBeginn(b, a))
  if (zeitraum === 'alle') liste = [...liste].sort(nachBeginn)
  return filter.limit ? liste.slice(0, filter.limit) : liste
}

/** Termin wie in Directus (bei regelmäßigen `beginn`/`ende` = erstes Datum) */
export async function ladeTerminRoh(slug: string): Promise<Termin | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const [termin] = await leseTermine({ filter: { _and: [VEROEFFENTLICHT, { slug: { _eq: slug } }] }, limit: 1 })
  return termin ?? null
}

/** Termin mit dem nächsten Datum (regelmäßige) */
export async function ladeTermin(slug: string): Promise<Termin | null> {
  const termin = await ladeTerminRoh(slug)
  return termin ? aufNaechstesDatum(termin, Date.now()) : null
}

/** angemeldete Personen (Summe `personen`, abgemeldete zählen nicht); bei regelmäßigen Terminen
 *  nur Anmeldungen seit dem Termin davor – jede Runde hat ihre eigenen Plätze */
export async function zaehleAnmeldungen(terminId: number, seit?: string | null): Promise<number> {
  const filter = { termin: { _eq: terminId }, status: { _eq: 'angemeldet' }, ...(seit ? { date_created: { _gt: seit } } : {}) }
  const zeilen = await directusServer<{ sum: { personen: string | number | null } }[]>('/items/anmeldungen', {
    query: { 'aggregate[sum]': 'personen', filter },
  }).catch((e) => {
    if (!seit) throw e
    // Server darf `date_created` noch nicht lesen (Setup-Skript) → alle zählen
    return directusServer<{ sum: { personen: string | number | null } }[]>('/items/anmeldungen', {
      query: { 'aggregate[sum]': 'personen', 'filter': { termin: { _eq: terminId }, status: { _eq: 'angemeldet' } } },
    })
  })
  return Number(zeilen[0]?.sum.personen ?? 0) || 0
}

export async function ladeTerminDetail(slug: string): Promise<TerminDetail | null> {
  const roh = await ladeTerminRoh(slug)
  if (!roh) return null
  const jetzt = Date.now()
  const termin = aufNaechstesDatum(roh, jetzt)
  const vorher = wiederholt(roh) ? naechstesVorkommen(roh, jetzt)?.vorher : null
  const plaetze_frei = termin.plaetze ? Math.max(0, termin.plaetze - await zaehleAnmeldungen(termin.id, vorher)) : null
  return {
    ...termin,
    beschreibung_html: termin.beschreibung ? markdownZuHtml(termin.beschreibung) : '',
    plaetze_frei,
    vergangen: !istKommend(termin, jetzt),
    wiederholung_text: wiederholungText(roh.wiederholung, roh.beginn),
  }
}
