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
