// GET /api/termine/austragen?id=…&sig=… – Link aus der Anmeldebestätigung („Klick hier, um dich wieder
// auszutragen“). Setzt die Anmeldung auf `abgemeldet` (Platz wird frei) und führt zurück zum Termin.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'austragen', 20)
  const { id, sig } = getQuery(event)
  if (!await pruefeSignatur('anmeldung-austragen', id, sig)) return sendRedirect(event, '/?austragen=ungueltig#was-kommt')

  const anmeldung = await directusServer<{ termin: number } | null>(`/items/anmeldungen/${Number(id)}`, { query: { fields: 'termin' } }).catch(() => null)
  if (!anmeldung) return sendRedirect(event, '/?austragen=ungueltig#was-kommt')
  await directusServer(`/items/anmeldungen/${Number(id)}`, { method: 'PATCH', body: { status: 'abgemeldet' } })
  const [termin] = await directusServer<{ slug: string }[]>('/items/termine', {
    query: { fields: 'slug', filter: { id: { _eq: anmeldung.termin }, status: { _eq: 'published' } }, limit: 1 },
  }).catch(() => [])
  return sendRedirect(event, termin ? `/termine/${termin.slug}?ausgetragen=1` : '/?ausgetragen=1#was-kommt')
})
