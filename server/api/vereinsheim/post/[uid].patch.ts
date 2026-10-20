// PATCH /api/vereinsheim/post/:uid?ordner=eingang|gesendet  { gelesen: boolean } – als (un)gelesen markieren (nur Vorstand)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-post-markieren', 300, 60 * 60 * 1000)
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const uid = Number(getRouterParam(event, 'uid'))
  if (!Number.isInteger(uid) || uid < 1) throw fail(404, 'mail', 'Nicht gefunden')
  const body = await leseBody(event)
  if (typeof body.gelesen !== 'boolean') throw fail(400, 'gelesen', 'gelesen fehlt')
  await setzeGelesen(getQuery(event).ordner === 'gesendet' ? 'gesendet' : 'eingang', uid, body.gelesen)
  return { ok: true }
})
