// Zeitpunkte zwischen Directus (UTC, ISO) und <input type="datetime-local"> (Ortszeit Königsdorf)
const ZONE = 'Europe/Berlin'

function teile(datum: Date) {
  const t = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(datum).map(p => [p.type, p.value]))
  return t as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>
}

/** "2026-11-15T13:00:00.000Z" → "2026-11-15T14:00" */
export function isoZuOrtszeit(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = teile(new Date(iso))
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
  const t = teile(new Date(alsUtc))
  const versatz = Date.UTC(+t.year, +t.month - 1, +t.day, +t.hour, +t.minute) - alsUtc
  return new Date(alsUtc - versatz).toISOString()
}
