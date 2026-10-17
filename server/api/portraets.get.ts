// GET /api/portraets?ausgabe=3
export default defineEventHandler((event) => ladePortraets(zahlAusQuery(getQuery(event).ausgabe, 9999)))
