// GET /api/dorfanzeiger?ressort=feste&ausgabe=3&hervorgehoben=true&limit=3
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ressort = Object.keys(RESSORTS).includes(String(query.ressort)) ? (query.ressort as Ressort) : undefined

  return ladeArtikelListe({
    ressort,
    ausgabe: zahlAusQuery(query.ausgabe, 9999),
    hervorgehoben: jaAusQuery(query.hervorgehoben),
    limit: zahlAusQuery(query.limit),
  })
})
