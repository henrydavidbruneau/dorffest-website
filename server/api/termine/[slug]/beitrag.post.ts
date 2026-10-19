// POST /api/termine/:slug/beitrag – "Was bringst du mit?" bei Terminen ohne Anmeldung.
// Speichert in Directus `beitraege`.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'beitrag')
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const termin = await ladeTerminDetail(getRouterParam(event, 'slug') ?? '')
  if (!termin || termin.mitbringen_position === 'aus') throw fail(404, 'kein_mitbringen', 'Für diesen Termin wird nichts gesammelt.')
  if (termin.vergangen) throw fail(410, 'vergangen', 'Dieser Termin liegt schon zurück.')

  const name = text(body.name, 80)
  const was = text(body.was, 200)
  const mail = body.email ? email(body.email) : ''

  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!was) throw fail(400, 'was', termin.mitbringen_frage || 'Was bringst du mit?')
  if (body.email && !mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')

  await pruefeTurnstile(event, body)
  await directusAnlegen('beitraege', { termin: termin.id, name, was, email: mail || null })
  return { ok: true }
})
