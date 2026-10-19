// Alle Datumsangaben in Ortszeit Königsdorf, egal wo der Server läuft (Netlify = UTC)
const ZEITZONE = 'Europe/Berlin'

function format(iso: string, optionen: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('de-DE', { timeZone: ZEITZONE, ...optionen }).format(new Date(iso))
}

/** "15.11" */
export function tagMonat(iso: string) {
  return format(iso, { day: '2-digit', month: '2-digit' }).replace(/\.$/, '')
}

/** "07.09.2025" */
export function datumLang(iso: string) {
  return format(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** "Sa" */
export function wochentagKurz(iso: string) {
  return format(iso, { weekday: 'short' }).replace('.', '')
}

/** "Samstag, 15. November 2025" */
export function datumAusgeschrieben(iso: string) {
  return format(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "14:00" */
export function uhrzeit(iso: string) {
  return format(iso, { hour: '2-digit', minute: '2-digit' })
}

/** "15" */
export function tagZahl(iso: string) {
  return format(iso, { day: 'numeric' })
}

/** "Nov" */
export function monatKurz(iso: string) {
  return format(iso, { month: 'short' }).replace('.', '')
}

/** "November 2025" */
export function monatJahr(iso: string) {
  return format(iso, { month: 'long', year: 'numeric' })
}

/** Stunde 0–23 in Ortszeit (für Begrüßungen). formatToParts, weil `format` auf Deutsch „18 Uhr“ liefert. */
export function stunde(datum: Date = new Date()) {
  const teil = new Intl.DateTimeFormat('de-DE', { timeZone: ZEITZONE, hour: 'numeric', hourCycle: 'h23' })
    .formatToParts(datum).find(t => t.type === 'hour')
  return Number(teil?.value ?? 0)
}

// ---------- Ortszeit ↔ ISO (Directus speichert UTC) ----------
// Für <input type="datetime-local"> im Vereinsheim und für wiederkehrende Termine
// (die Uhrzeit bleibt in Ortszeit gleich, auch über die Zeitumstellung hinweg).

function ortszeitTeile(datum: Date) {
  const t = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: ZEITZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(datum).map(p => [p.type, p.value]))
  return t as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>
}

/** "2026-11-15T13:00:00.000Z" → "2026-11-15T14:00" */
export function isoZuOrtszeit(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = ortszeitTeile(new Date(iso))
  return `${t.year}-${t.month}-${t.day}T${t.hour}:${t.minute}`
}

/** "2026-11-15T14:00" (Ortszeit) → ISO in UTC */
export function ortszeitZuIso(lokal: string): string | null {
  if (!lokal) return null
  const [datum, zeit = '00:00'] = lokal.split('T')
  const [j, m, d] = datum!.split('-').map(Number)
  const [h, min] = zeit.split(':').map(Number)
  // erst als UTC annehmen, dann um den Versatz der Zeitzone zu diesem Zeitpunkt korrigieren
  const alsUtc = Date.UTC(j!, m! - 1, d!, h!, min!)
  const t = ortszeitTeile(new Date(alsUtc))
  const versatz = Date.UTC(+t.year, +t.month - 1, +t.day, +t.hour, +t.minute) - alsUtc
  return new Date(alsUtc - versatz).toISOString()
}
