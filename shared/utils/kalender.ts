// „Zum Kalender hinzufügen“: Links für Google Kalender, Outlook und die .ics-Datei (Apple & Co.).
// Genutzt auf der Terminseite (Menü) und in der Anmeldebestätigung (drei kleine Knöpfe).
// Regelmäßige Termine: ab dem übergebenen Datum mit Wiederholung (Google versteht RRULE, Outlook nicht).

export interface KalenderTermin {
  titel: string
  slug: string
  beginn: string | null
  ende: string | null
  uhrzeit_folgt?: boolean | null
  ort?: string | null
  adresse?: string | null
  kurzbeschreibung?: string | null
  wiederholung?: string | null
  wiederholung_bis?: string | null
}

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const tag = (iso: string) => isoZuOrtszeit(iso).slice(0, 10).replace(/-/g, '')
const naechsterTag = (iso: string) => tag(new Date(Date.parse(iso) + 86_400_000).toISOString())

export function kalenderLinks(t: KalenderTermin, basis: string) {
  const seite = `${basis}/termine/${t.slug}`
  const ics = `${basis}/api/termine/${t.slug}/kalender.ics`
  if (!t.beginn) return { google: null, outlook: null, ics: null }
  const ende = t.ende ?? new Date(Date.parse(t.beginn) + 2 * 60 * 60 * 1000).toISOString()
  const wo = [t.ort, t.adresse].filter(Boolean).join(', ')
  const text = [t.kurzbeschreibung, seite].filter(Boolean).join('\n\n')
  const rrule = wiederholungRrule(t.wiederholung, t.beginn, t.wiederholung_bis)

  const google = new URL('https://calendar.google.com/calendar/render')
  google.searchParams.set('action', 'TEMPLATE')
  google.searchParams.set('text', t.titel)
  google.searchParams.set('dates', t.uhrzeit_folgt ? `${tag(t.beginn)}/${naechsterTag(t.beginn)}` : `${utc(t.beginn)}/${utc(ende)}`)
  google.searchParams.set('details', text)
  if (wo) google.searchParams.set('location', wo)
  if (rrule) google.searchParams.set('recur', rrule)
  google.searchParams.set('ctz', 'Europe/Berlin')

  const outlook = new URL('https://outlook.live.com/calendar/0/action/compose')
  outlook.searchParams.set('rru', 'addevent')
  outlook.searchParams.set('subject', t.titel)
  outlook.searchParams.set('startdt', t.beginn)
  outlook.searchParams.set('enddt', ende)
  outlook.searchParams.set('body', text)
  if (wo) outlook.searchParams.set('location', wo)
  if (t.uhrzeit_folgt) outlook.searchParams.set('allday', 'true')

  return { google: google.toString(), outlook: outlook.toString(), ics }
}
