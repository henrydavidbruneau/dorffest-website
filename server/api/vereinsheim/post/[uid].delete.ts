// DELETE /api/vereinsheim/post/:uid?ordner=eingang|gesendet – Mail in den Papierkorb legen (nur Vorstand)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-post-loeschen', 100, 60 * 60 * 1000)
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Löschen darf nur der Vorstand.')
  const uid = Number(getRouterParam(event, 'uid'))
  if (!Number.isInteger(uid) || uid < 1) throw fail(404, 'mail', 'Nicht gefunden')
  return { ok: true, ...(await loeschePost(getQuery(event).ordner === 'gesendet' ? 'gesendet' : 'eingang', uid)) }
})
