// GET /api/termine/:slug
export default defineEventHandler(async (event) => {
  const termin = await ladeTerminDetail(getRouterParam(event, 'slug') ?? '')
  if (!termin) throw fail(404, 'nicht_gefunden', 'Termin nicht gefunden')
  return termin
})
