// POST /api/termine/:slug/wuensche/:id/stimme  { an: true | false } – dafür stimmen bzw. Stimme zurücknehmen.
// Eine Stimme je Wunsch und Browser (Cookie-Kennung, siehe server/utils/wuensche.ts).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'wunsch-stimme', 60)
  const body = await leseBody(event)
  const termin = await terminMitWunschliste(getRouterParam(event, 'slug') ?? '')
  if (termin.vergangen) throw fail(410, 'vergangen', 'Dieser Termin liegt schon zurück – abgestimmt ist.')

  const id = Number(getRouterParam(event, 'id'))
  const liste = await wunschliste(event, termin.id)
  if (!liste.some(w => w.id === id)) throw fail(404, 'wunsch', 'Diesen Wunsch gibt es nicht (mehr).')

  // beim ersten Mal bekommt der Browser hier seine Kennung (Cookie) – deshalb weitergeben
  const waehler = waehlerVon(event, true)!
  await stimmeSetzen(waehler, id, body.an !== false)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return wunschliste(event, termin.id, waehler)
})
