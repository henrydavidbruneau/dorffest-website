// POST /api/vereinsheim/termine/:id/rundmail – Mail an alle Angemeldeten (einzeln, ohne BCC)
// und Protokoll in `termin_rundmails`. Läuft mit dem Token der Person (Recht: anmeldungen lesen).
// Beim Plenum auf Wunsch auch an alle, die erinnert werden wollen (mit Abmelde-Link).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-rundmail', 10)
  const id = Number(getRouterParam(event, 'id'))
  const body = await leseBody(event)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.trim().slice(0, 10000) : ''
  if (!betreff || inhalt.length < 10) throw fail(400, 'leer', 'Bitte Betreff und Text eingeben.')

  const termin = await directusPerson<{ titel: string, slug: string } | null>(event, `/items/termine/${id}`, { query: { fields: 'titel,slug' } })
  if (!termin) throw fail(404, 'termin', 'Termin nicht gefunden')
  // regelmäßige Termine: nur die Anmeldungen der gewählten Runde (IDs aus der Liste)
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : null
  const anmeldungen = await directusPerson<{ name: string, email: string }[]>(event, '/items/anmeldungen', {
    query: { fields: 'name,email', filter: { termin: { _eq: id }, status: { _eq: 'angemeldet' }, ...(ids ? { id: { _in: ids.length ? ids : [0] } } : {}) }, limit: -1 },
  })
  const abos = istPlenum(termin.slug) && body.mitErinnerung === true
    ? await directusPerson<PlenumAbo[]>(event, '/items/plenum_erinnerungen', {
        query: { fields: 'id,name,email,wie', filter: { bestaetigt: { _eq: true }, abgemeldet_am: { _null: true } }, limit: -1 },
      })
    : []
  // jede Adresse nur einmal (Angemeldete zuerst, sie brauchen keinen Abmelde-Link)
  const alle: { name: string | null, email: string, abo?: number }[] = [...anmeldungen, ...abos.map(a => ({ name: a.name, email: a.email, abo: a.id }))]
  const empfaenger = [...new Map(alle.filter(a => a.email).reverse().map(a => [a.email.toLowerCase(), a])).values()]
  let gesendet = 0
  for (const a of empfaenger) {
    const abmelden = a.abo ? await plenumAbmeldeLink(event, a.abo) : null
    await sendeMail({
      an: a.email,
      betreff,
      tags: ['rundmail'],
      text: [`Hallo ${a.name || 'du'},`, inhalt, abmelden ? `Keine Plenum-Erinnerungen mehr? ${abmelden}` : '', GRUSS].filter(Boolean).join('\n\n'),
    }).then(() => gesendet++, e => console.error('[rundmail]', a.email, e?.data ?? e))
  }
  await directusPerson(event, '/items/termin_rundmails', {
    method: 'POST',
    body: { termin: id, betreff, text: inhalt, empfaenger_anzahl: gesendet, gesendet_am: new Date().toISOString() },
  })
  return { ok: true, gesendet, empfaenger: empfaenger.length }
})
