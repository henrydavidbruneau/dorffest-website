// POST /api/vereinsheim/rundbrief – { betreff, text, test? } (nur Vorstand)
// test: nur an die eigene Adresse (bzw. das Kontakt-Postfach), sonst an die ganze Newsletter-Liste.
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
    await sendeMail({ an, betreff: `[Test] ${betreff}`, text: rundbriefText(inhalt), tags: ['rundbrief-test'], rubrik: 'Rundbrief' })
    return { ok: true, an }
  }
  if (!rundbriefKonfig().eingerichtet) throw fail(409, 'brevo', 'Brevo ist noch nicht eingerichtet (NUXT_BREVO_API_KEY und NUXT_BREVO_NEWSLETTER_LISTE auf Netlify).')
  const id = await rundbriefVerschicken(betreff, inhalt).catch((e) => {
    console.error('[rundbrief]', e?.data ?? e)
    throw fail(502, 'brevo', `Brevo hat abgelehnt: ${e?.data?.message ?? 'unbekannter Fehler'}`)
  })
  console.info(`[rundbrief] Kampagne ${id} „${betreff}“ verschickt von ${person.first_name ?? person.id}`)
  return { ok: true }
})
