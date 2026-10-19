// GET /api/vereinsheim/post?anzahl=30 – Kontakt-Postfach (nur Vorstand)
export default defineEventHandler(async (event) => {
  if (!(await ich(event)).vorstand) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const { eingerichtet, webmail } = postfachKonfig()
  if (!eingerichtet) return { eingerichtet, webmail, mails: [] }
  const anzahl = Math.min(Number(getQuery(event).anzahl) || 30, 50)
  return { eingerichtet, webmail, mails: await ladePost(anzahl) }
})
