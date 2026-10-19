// GET /api/vereinsheim/post?ordner=eingang|gesendet&anzahl=30 – Kontakt-Postfach (nur Vorstand)
export default defineEventHandler(async (event) => {
  if (!(await ich(event)).vorstand) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const { eingerichtet, webmail } = postfachKonfig()
  if (!eingerichtet) return { eingerichtet, webmail, mails: [] }
  const query = getQuery(event)
  const ordner: Ordner = query.ordner === 'gesendet' ? 'gesendet' : 'eingang'
  const anzahl = Math.min(Number(query.anzahl) || 30, 50)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { eingerichtet, webmail, mails: await ladePost(ordner, anzahl) }
})
