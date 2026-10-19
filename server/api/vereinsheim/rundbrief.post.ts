// POST /api/vereinsheim/rundbrief – { id?, betreff, text, test? } (nur Vorstand)
// test: nur an die eigene Adresse (bzw. das Kontakt-Postfach), sonst an die ganze Newsletter-Liste.
// Nach dem Versand steht der Rundbrief in Directus `rundbriefe` (ein Entwurf `id` wird zum verschickten).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-rundbrief', 10, 60 * 60 * 1000)
  const person = await ich(event)
  if (!person.vorstand) throw fail(403, 'rechte', 'Rundbriefe schickt nur der Vorstand.')
  const body = await leseBody(event)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.replace(/\r\n?/g, '\n').trim().slice(0, 50_000) : ''
  if (!betreff) throw fail(400, 'betreff', 'Bitte einen Betreff eingeben.')
  if (inhalt.length < 10) throw fail(400, 'text', 'Der Rundbrief ist noch leer.')

  if (body.test === true) {
    const an = echteMail(person.email) ?? KONTAKT_MAIL
    await sendeMail({ an, betreff: `[Test] ${betreff}`, text: rundbriefText(inhalt), tags: ['rundbrief-test'], rubrik: 'Rundbrief', grosserGruss: true })
    return { ok: true, an }
  }
  const { eingerichtet, fehlt } = rundbriefKonfig()
  if (!eingerichtet) throw fail(409, 'brevo', `Brevo ist noch nicht eingerichtet – auf Netlify fehlt: ${fehlt.join(', ')}.`)
  const entwurf = Number(body.id) || null
  if (entwurf) {
    const alt = await directusPerson<{ status: string }>(event, `/items/rundbriefe/${entwurf}`, { query: { fields: 'status' } })
    if (alt.status === 'verschickt') throw fail(409, 'schon', 'Dieser Rundbrief ist schon verschickt. Dupliziere ihn, um ihn noch einmal zu schicken.')
  }
  const { abonnenten } = await rundbriefStand().catch(() => ({ abonnenten: null }))
  const kampagne = await rundbriefVerschicken(betreff, inhalt).catch((e) => {
    console.error('[rundbrief]', e?.data ?? e)
    throw fail(502, 'brevo', `Brevo hat abgelehnt: ${e?.data?.message ?? 'unbekannter Fehler'}`)
  })
  console.info(`[rundbrief] Kampagne ${kampagne} „${betreff}“ verschickt von ${person.first_name ?? person.id}`)
  const daten = { status: 'verschickt', betreff, text: inhalt, verschickt_am: new Date().toISOString(), empfaenger_anzahl: abonnenten, brevo_kampagne: kampagne }
  await directusPerson(event, entwurf ? `/items/rundbriefe/${entwurf}` : '/items/rundbriefe', { method: entwurf ? 'PATCH' : 'POST', body: daten })
    .catch(e => console.error('[rundbrief] Protokoll in Directus', e?.data ?? e))
  return { ok: true }
})
