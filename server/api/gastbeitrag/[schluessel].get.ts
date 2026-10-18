// GET /api/gastbeitrag/:schluessel – gibt es den privaten Link (noch)?
export default defineEventHandler(async (event) => {
  rateLimit(event, 'gastbeitrag-link', 30)
  const einladung = await ladeEinladung(getRouterParam(event, 'schluessel') ?? '')
  if (!einladung) throw fail(404, 'link', 'Diesen Link gibt es nicht (mehr).')
  return oeffentlicheEinladung(einladung)
})
