// GET /bilder/:id?width=…&height=…&format=webp&quality=80&fit=cover
// Bilder aus Directus über den Server-Token ausliefern (öffentlich hat Directus keine Rechte).
// Directus transformiert (Größe/Format), Netlify cacht die Antwort. Nur Ordner termine/artikel/stimmen/rundbrief (Bilder in Mails)
// sind für den Server-Token lesbar – alles andere endet hier mit 404.

const ERLAUBT = ['width', 'height', 'quality', 'format', 'fit'] as const
const FORMATE = ['webp', 'jpg', 'png', 'avif', 'auto']
const FITS = ['cover', 'contain', 'inside', 'outside']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) throw fail(404, 'bild', 'Bild nicht gefunden')

  // Nur bekannte Parameter in vernünftigen Grenzen durchreichen
  const query = getQuery(event)
  const params = new URLSearchParams()
  for (const key of ERLAUBT) {
    const wert = String(query[key] ?? '')
    if (!wert) continue
    if ((key === 'width' || key === 'height') && /^\d{1,4}$/.test(wert)) params.set(key, String(Math.min(Number(wert), 3000)))
    if (key === 'quality' && /^\d{1,3}$/.test(wert)) params.set(key, String(Math.min(Number(wert), 100)))
    if (key === 'format' && FORMATE.includes(wert)) params.set(key, wert)
    if (key === 'fit' && FITS.includes(wert)) params.set(key, wert)
  }
  // Standard: WebP in guter Qualität (der @nuxt/image-Provider schickt beides nicht mit)
  if (!params.has('format')) params.set('format', 'webp')
  if (!params.has('quality')) params.set('quality', '80')

  const { directusUrl, directusToken } = useRuntimeConfig()
  if (!directusUrl || !directusToken) throw fail(503, 'directus', 'Directus ist nicht konfiguriert')
  const antwort = await fetch(`${directusUrl.replace(/\/+$/, '')}/assets/${id}?${params}`, {
    headers: { Authorization: `Bearer ${directusToken}` },
  })
  if (!antwort.ok) throw fail(antwort.status === 403 || antwort.status === 404 ? 404 : 502, 'bild', 'Bild nicht gefunden')

  setHeader(event, 'Content-Type', antwort.headers.get('content-type') ?? 'application/octet-stream')
  // Browser: 1 Tag, Netlify-CDN: 30 Tage (ein Bild mit gleicher ID ändert sich praktisch nie)
  setHeader(event, 'Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  setHeader(event, 'Netlify-CDN-Cache-Control', 'public, durable, max-age=2592000, stale-while-revalidate=604800')
  setHeader(event, 'Netlify-Vary', 'query=width|height|quality|format|fit')
  return new Uint8Array(await antwort.arrayBuffer())
})
