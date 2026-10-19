// Regelmäßige Termine: ein Termin in Directus mit `wiederholung` (+ optional `wiederholung_bis`).
// `beginn`/`ende` sind das erste Datum; Website und Vereinsheim rechnen daraus das nächste aus.
// Gerechnet wird in Ortszeit (Europe/Berlin), damit „19 Uhr“ auch nach der Zeitumstellung 19 Uhr bleibt.

export type Wiederholung = 'aus' | 'woechentlich' | 'zweiwoechentlich' | 'monatlich_wochentag' | 'monatlich_datum'

export const WIEDERHOLUNGEN: Record<Wiederholung, string> = {
  aus: 'einmalig',
  woechentlich: 'jede Woche',
  zweiwoechentlich: 'alle zwei Wochen',
  monatlich_wochentag: 'monatlich, gleicher Wochentag',
  monatlich_datum: 'monatlich, gleiches Datum',
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const ORDNUNG = ['ersten', 'zweiten', 'dritten', 'vierten']

/** Ortszeit als Zahlen; Wochentag und Monatslänge über UTC-Rechnung mit denselben Zahlen */
interface Lokal { j: number, m: number, d: number, h: number, min: number }

function zerlegen(iso: string): Lokal {
  const [datum, zeit] = isoZuOrtszeit(iso).split('T') as [string, string]
  const [j, m, d] = datum.split('-').map(Number) as [number, number, number]
  const [h, min] = zeit.split(':').map(Number) as [number, number]
  return { j, m, d, h, min }
}

function zusammen(l: Lokal): string {
  const z = (n: number) => String(n).padStart(2, '0')
  return ortszeitZuIso(`${l.j}-${z(l.m)}-${z(l.d)}T${z(l.h)}:${z(l.min)}`)!
}

const wochentag = (l: Pick<Lokal, 'j' | 'm' | 'd'>) => new Date(Date.UTC(l.j, l.m - 1, l.d)).getUTCDay()
const tageImMonat = (j: number, m: number) => new Date(Date.UTC(j, m, 0)).getUTCDate()

function plusTage(l: Lokal, tage: number): Lokal {
  const x = new Date(Date.UTC(l.j, l.m - 1, l.d + tage))
  return { ...l, j: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }
}

/** n-ter (1–4) bzw. letzter (5) Wochentag eines Monats */
function nterWochentag(j: number, m: number, tag: number, n: number): number {
  if (n >= 5) {
    const letzter = tageImMonat(j, m)
    return letzter - ((wochentag({ j, m, d: letzter }) - tag + 7) % 7)
  }
  const erster = (tag - wochentag({ j, m, d: 1 }) + 7) % 7 + 1
  return erster + (n - 1) * 7
}

/** n-ter Wochentag des Starttermins: 1–4, 5 = „letzter“ (ab dem 29.) */
const welcherWochentag = (l: Lokal) => (l.d > 28 ? 5 : Math.ceil(l.d / 7))

/** k-tes Vorkommen (k = 0 ist der Start) */
function vorkommen(start: Lokal, art: Wiederholung, k: number): Lokal | null {
  if (art === 'woechentlich') return plusTage(start, 7 * k)
  if (art === 'zweiwoechentlich') return plusTage(start, 14 * k)
  const monate = start.m - 1 + k
  const j = start.j + Math.floor(monate / 12)
  const m = (monate % 12) + 1
  if (art === 'monatlich_datum') return { ...start, j, m, d: Math.min(start.d, tageImMonat(j, m)) } // kein 31. im April → 30.
  if (art === 'monatlich_wochentag') return { ...start, j, m, d: nterWochentag(j, m, wochentag(start), welcherWochentag(start)) }
  return k === 0 ? start : null
}

type TerminZeiten = { beginn: string | null, ende: string | null, wiederholung?: string | null, wiederholung_bis?: string | null }

/** alle Vorkommen der Reihe nacheinander (höchstens 600, endet mit `wiederholung_bis`) */
function* alleVorkommen(t: TerminZeiten & { beginn: string }): Generator<Vorkommen> {
  const art = (t.wiederholung ?? 'aus') as Wiederholung
  if (art === 'aus' || !(art in WIEDERHOLUNGEN)) {
    yield { beginn: t.beginn, ende: t.ende }
    return
  }
  const dauer = t.ende ? Date.parse(t.ende) - Date.parse(t.beginn) : null
  // „bis“ gilt einschließlich des ganzen Tages
  const bis = t.wiederholung_bis ? Date.parse(ortszeitZuIso(`${t.wiederholung_bis.slice(0, 10)}T23:59`)!) : Infinity
  const start = zerlegen(t.beginn)
  for (let k = 0; k < 600; k++) {
    const l = vorkommen(start, art, k)
    if (!l) continue
    const beginn = zusammen(l)
    if (Date.parse(beginn) > bis) return
    yield { beginn, ende: dauer !== null ? new Date(Date.parse(beginn) + dauer).toISOString() : null }
  }
}

export interface Vorkommen {
  beginn: string
  ende: string | null
}

/**
 * Das Vorkommen, das gerade läuft oder als nächstes kommt (Ende bzw. Beginn + 1 Tag ≥ jetzt),
 * sonst das letzte. `vorher` ist der Beginn des Vorkommens davor (für Anmeldungen je Termin).
 */
export function naechstesVorkommen(t: TerminZeiten, jetzt = Date.now()): (Vorkommen & { vorher: string | null }) | null {
  if (!t.beginn) return null
  let letztes: Vorkommen | null = null
  for (const v of alleVorkommen({ ...t, beginn: t.beginn })) {
    if ((v.ende ? Date.parse(v.ende) : Date.parse(v.beginn) + 86_400_000) >= jetzt) return { ...v, vorher: letztes?.beginn ?? null }
    letztes = v
  }
  return letztes ? { ...letztes, vorher: null } : { beginn: t.beginn, ende: t.ende, vorher: null }
}

/**
 * Zu welchem Vorkommen gehört eine Anmeldung von `zeit`? Zum ersten, das danach beginnt
 * (wie auf der Website: Anmeldungen seit dem Beginn des letzten Treffens zählen fürs nächste).
 * Nach dem Ende der Reihe: das letzte.
 */
export function vorkommenFuer(t: TerminZeiten, zeit: number): Vorkommen | null {
  if (!t.beginn) return null
  let letztes: Vorkommen | null = null
  for (const v of alleVorkommen({ ...t, beginn: t.beginn })) {
    if (Date.parse(v.beginn) > zeit) return v
    letztes = v
  }
  return letztes
}

/** „jeden 1. Montag im Monat“ … für Terminseite und Vereinsheim */
export function wiederholungText(art: string | null | undefined, beginn: string | null): string {
  if (!beginn || !art || art === 'aus') return ''
  const l = zerlegen(beginn)
  const tag = WOCHENTAGE[wochentag(l)]!
  if (art === 'woechentlich') return `jeden ${tag}`
  if (art === 'zweiwoechentlich') return `jeden zweiten ${tag}`
  if (art === 'monatlich_datum') {
    if (l.d === 31) return 'jeden Monat am Monatsletzten'
    return l.d > 28 ? `jeden Monat am ${l.d}. (sonst am Monatsletzten)` : `jeden Monat am ${l.d}.`
  }
  if (art === 'monatlich_wochentag') {
    const n = welcherWochentag(l)
    return `jeden ${n >= 5 ? 'letzten' : ORDNUNG[n - 1]} ${tag} im Monat`
  }
  return ''
}

/** Kurzform für den Terminkalender: „1. Mo“, „jeden Mi“ … */
export function wiederholungKurz(art: string | null | undefined, beginn: string | null): string {
  if (!beginn || !art || art === 'aus') return ''
  const l = zerlegen(beginn)
  const kurz = WOCHENTAGE[wochentag(l)]!.slice(0, 2)
  if (art === 'woechentlich') return `jeden ${kurz}`
  if (art === 'zweiwoechentlich') return `14-tägl. ${kurz}`
  if (art === 'monatlich_datum') return l.d === 31 ? 'Monatsletzter' : `am ${l.d}.`
  if (art === 'monatlich_wochentag') {
    const n = welcherWochentag(l)
    return `${n >= 5 ? 'letzter' : `${n}.`} ${kurz}`
  }
  return ''
}

/** RRULE für die Kalenderdatei */
export function wiederholungRrule(art: string | null | undefined, beginn: string | null, bis: string | null | undefined): string {
  if (!beginn || !art || art === 'aus') return ''
  const l = zerlegen(beginn)
  const tag = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][wochentag(l)]
  const ende = bis ? `;UNTIL=${bis.slice(0, 10).replace(/-/g, '')}T235959Z` : ''
  if (art === 'woechentlich') return `RRULE:FREQ=WEEKLY${ende}`
  if (art === 'zweiwoechentlich') return `RRULE:FREQ=WEEKLY;INTERVAL=2${ende}`
  if (art === 'monatlich_datum') {
    // ab dem 29.: in kürzeren Monaten der Monatsletzte (BYMONTHDAY=28,…,d + letzter Treffer)
    if (l.d > 28) return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${Array.from({ length: l.d - 27 }, (_, i) => 28 + i).join(',')};BYSETPOS=-1${ende}`
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${l.d}${ende}`
  }
  if (art === 'monatlich_wochentag') {
    const n = welcherWochentag(l)
    return `RRULE:FREQ=MONTHLY;BYDAY=${n >= 5 ? -1 : n}${tag}${ende}`
  }
  return ''
}
