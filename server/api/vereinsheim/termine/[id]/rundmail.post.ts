// POST /api/vereinsheim/termine/:id/rundmail – Mail an alle Angemeldeten (einzeln, ohne BCC)
// und Protokoll in `termin_rundmails`. Läuft mit dem Token der Person (Recht: anmeldungen lesen).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-rundmail', 10)
  const id = Number(getRouterParam(event, 'id'))
  const body = await leseBody(event)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.trim().slice(0, 10000) : ''
  if (!betreff || inhalt.length < 10) throw fail(400, 'leer', 'Bitte Betreff und Text eingeben.')

  const termin = await directusPerson<{ titel: string } | null>(event, `/items/termine/${id}`, { query: { fields: 'titel' } })
  if (!termin) throw fail(404, 'termin', 'Termin nicht gefunden')
  // regelmäßige Termine: nur die Anmeldungen der gewählten Runde (IDs aus der Liste)
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : null
  const anmeldungen = await directusPerson<{ name: string, email: string }[]>(event, '/items/anmeldungen', {
    query: { fields: 'name,email', filter: { termin: { _eq: id }, status: { _eq: 'angemeldet' }, ...(ids ? { id: { _in: ids.length ? ids : [0] } } : {}) }, limit: -1 },
  })
  // jede Adresse nur einmal
  const empfaenger = [...new Map(anmeldungen.filter(a => a.email).map(a => [a.email.toLowerCase(), a])).values()]
  let gesendet = 0
  for (const a of empfaenger) {
    await sendeMail({
      an: a.email,
      betreff,
      tags: ['rundmail'],
      text: `Hallo ${a.name},\n\n${inhalt}\n\n${GRUSS}`,
    }).then(() => gesendet++, e => console.error('[rundmail]', a.email, e?.data ?? e))
  }
  await directusPerson(event, '/items/termin_rundmails', {
    method: 'POST',
    body: { termin: id, betreff, text: inhalt, empfaenger_anzahl: gesendet, gesendet_am: new Date().toISOString() },
  })
  return { ok: true, gesendet, empfaenger: empfaenger.length }
})
