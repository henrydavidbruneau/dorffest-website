// GET /api/vereinsheim/rundbrief – Abonnent*innen, Rundbriefe aus Directus (Entwürfe + verschickte, mit Text
// zum Ansehen/Duplizieren) und der Status der Kampagnen bei Brevo (nur Vorstand)
interface RundbriefZeile { id: number, status: string, betreff: string, text: string, verschickt_am: string | null, empfaenger_anzahl: number | null, brevo_kampagne: number | null, date_updated: string | null, date_created: string }

export default defineEventHandler(async (event) => {
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Rundbriefe schickt nur der Vorstand.')
  setHeader(event, 'Cache-Control', 'private, no-store')
  const rundbriefe = await directusPerson<RundbriefZeile[]>(event, '/items/rundbriefe', {
    query: { fields: 'id,status,betreff,text,verschickt_am,empfaenger_anzahl,brevo_kampagne,date_updated,date_created', sort: '-date_created', limit: 50 },
  }).catch(() => [])
  const { eingerichtet, fehlt } = rundbriefKonfig()
  if (!eingerichtet) return { eingerichtet: false, fehlt, abonnenten: 0, rundbriefe, kampagnen: [] }
  const stand = await rundbriefStand().catch((e) => {
    console.error('[rundbrief] Brevo-Stand', e?.data ?? e)
    return { abonnenten: 0, kampagnen: [] }
  })
  return { eingerichtet: true, fehlt: [], ...stand, rundbriefe }
})
