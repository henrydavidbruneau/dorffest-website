// POST /api/termine/:slug/beitrag – "Was bringst du mit?".
// Vorerst nur Prüfung + Log. Später: in Directus `beitraege` speichern.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'beitrag')
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const termin = await ladeTerminDetail(getRouterParam(event, 'slug') ?? '')
  if (!termin || !termin.mitbringen_aktiv) throw fail(404, 'kein_mitbringen', 'Für diesen Termin wird nichts gesammelt.')
  if (termin.vergangen) throw fail(410, 'vergangen', 'Dieser Termin liegt schon zurück.')

  const name = text(body.name, 80)
  const was = text(body.was, 200)
  const mail = body.email ? email(body.email) : ''

  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!was) throw fail(400, 'was', 'Was bringst du mit?')
  if (body.email && !mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')

  console.info('[beitrag]', { termin: termin.slug, name, was, email: mail || null })
  return { ok: true }
})
