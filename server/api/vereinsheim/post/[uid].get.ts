// GET /api/vereinsheim/post/:uid?ordner=eingang|gesendet – eine Mail lesen (nur Vorstand)
export default defineEventHandler(async (event) => {
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const uid = Number(getRouterParam(event, 'uid'))
  if (!Number.isInteger(uid) || uid < 1) throw fail(404, 'mail', 'Nicht gefunden')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return ladeMail(getQuery(event).ordner === 'gesendet' ? 'gesendet' : 'eingang', uid)
})
