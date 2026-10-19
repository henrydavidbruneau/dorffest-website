// POST /api/vereinsheim/logout
export default defineEventHandler(async (event) => {
  await abmelden(event)
  return { ok: true }
})
