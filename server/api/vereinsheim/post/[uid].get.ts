// GET /api/vereinsheim/post/:uid – eine Mail lesen (nur Vorstand, bleibt im Postfach unverändert)
export default defineEventHandler(async (event) => {
  if (!(await ich(event)).vorstand) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const uid = Number(getRouterParam(event, 'uid'))
  if (!Number.isInteger(uid) || uid < 1) throw fail(404, 'mail', 'Nicht gefunden')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return ladeMail(uid)
})
