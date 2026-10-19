// GET /api/verein – Kontakt, Konto, Infochannel
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return ladeVerein()
})
