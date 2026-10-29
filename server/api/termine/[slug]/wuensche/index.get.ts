// GET /api/termine/:slug/wuensche – Wunschliste (meiste Stimmen zuerst, `meine` = dieser Browser ist dafür)
export default defineEventHandler(async (event) => {
  const termin = await terminMitWunschliste(getRouterParam(event, 'slug') ?? '')
  // je Browser verschieden (`meine`) – nicht zwischenspeichern
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return wunschliste(event, termin.id)
})
