// GET /api/termine/:slug
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const termin = await ladeTermin(slug)
  if (!termin) {
    throw createError({ statusCode: 404, statusMessage: 'Termin nicht gefunden', data: { code: 'nicht_gefunden' } })
  }
  return termin
})
