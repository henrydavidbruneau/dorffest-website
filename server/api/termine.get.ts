// GET /api/termine?zeitraum=kommend|vergangen|alle&hervorgehoben=true&limit=3
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const zeitraum = ['kommend', 'vergangen', 'alle'].includes(String(query.zeitraum))
    ? (query.zeitraum as TerminFilter['zeitraum'])
    : 'kommend'

  return ladeTermine({
    zeitraum,
    hervorgehoben: jaAusQuery(query.hervorgehoben),
    limit: zahlAusQuery(query.limit),
  })
})
