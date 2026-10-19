// GET /api/vereinsheim/rundbrief – Zahl der Abonnent*innen und die letzten Rundbriefe (nur Vorstand)
export default defineEventHandler(async (event) => {
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Rundbriefe schickt nur der Vorstand.')
  const { eingerichtet, fehlt } = rundbriefKonfig()
  if (!eingerichtet) return { eingerichtet: false, fehlt, abonnenten: 0, verschickt: [] }
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { eingerichtet: true, ...(await rundbriefStand()) }
})
