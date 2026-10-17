// GET /api/termine/:slug/kalender.ics – Termin als Kalenderdatei
function icsZeit(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsText(wert: string) {
  return wert.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`)
}

export default defineEventHandler(async (event) => {
  const termin = await ladeTermin(getRouterParam(event, 'slug') ?? '')
  if (!termin?.beginn) throw fail(404, 'kein_datum', 'Für diesen Termin gibt es noch kein Datum.')

  const ende = termin.ende ?? new Date(Date.parse(termin.beginn) + 2 * 60 * 60 * 1000).toISOString()
  const url = `${getRequestURL(event).origin}/termine/${termin.slug}`
  const zeilen = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Koenigsdorf rueckt zusammen//Termine//DE',
    'BEGIN:VEVENT',
    `UID:termin-${termin.id}@koenigsdorf-rueckt-zusammen.de`,
    `DTSTAMP:${icsZeit(new Date().toISOString())}`,
    // Uhrzeit noch offen → ganztägig
    ...(termin.uhrzeit_folgt
      ? [`DTSTART;VALUE=DATE:${termin.beginn.slice(0, 10).replace(/-/g, '')}`]
      : [`DTSTART:${icsZeit(termin.beginn)}`, `DTEND:${icsZeit(ende)}`]),
    `SUMMARY:${icsText(termin.titel)}`,
    termin.ort ? `LOCATION:${icsText([termin.ort, termin.adresse].filter(Boolean).join(', '))}` : '',
    termin.kurzbeschreibung ? `DESCRIPTION:${icsText(`${termin.kurzbeschreibung}\n\n${url}`)}` : `DESCRIPTION:${icsText(url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${termin.slug}.ics"`)
  return zeilen.join('\r\n')
})
