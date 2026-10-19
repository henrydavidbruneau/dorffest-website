// GET /api/vereinsheim/bild/:id?width=… – Bilder fürs Vereinsheim mit dem Token der Person
// (auch Gastbeitrags-Fotos und eigene Belege, die die öffentliche Bild-Route nicht zeigt)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/.test(id)) throw fail(404, 'bild', 'Bild nicht gefunden')
  const breite = Math.min(Number(getQuery(event).width) || 800, 2000)
  const download = getQuery(event).download === '1'
  const { directusUrl } = useRuntimeConfig()
  const antwort = await mitSession(event, async (token) => {
    const r = await fetch(`${directusUrl.replace(/\/+$/, '')}/assets/${id}${download ? '' : `?width=${breite}&fit=inside&format=auto`}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) throw createError({ statusCode: 401 })
    return r
  })
  if (!antwort.ok) throw fail(404, 'bild', 'Bild nicht gefunden')
  setHeader(event, 'Content-Type', antwort.headers.get('content-type') ?? 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  if (download) setHeader(event, 'Content-Disposition', antwort.headers.get('content-disposition') ?? 'attachment')
  return new Uint8Array(await antwort.arrayBuffer())
})
