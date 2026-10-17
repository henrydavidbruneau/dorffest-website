// GET /api/dorfanzeiger/:slug
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const artikel = await ladeArtikel(slug)
  if (!artikel) {
    throw createError({ statusCode: 404, statusMessage: 'Artikel nicht gefunden', data: { code: 'nicht_gefunden' } })
  }
  return artikel
})
