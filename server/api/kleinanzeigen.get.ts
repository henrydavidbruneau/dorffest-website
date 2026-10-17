// GET /api/kleinanzeigen?limit=4
export default defineEventHandler((event) => ladeKleinanzeigen(zahlAusQuery(getQuery(event).limit)))
