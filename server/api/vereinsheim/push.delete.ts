// DELETE /api/vereinsheim/push  { endpoint } – Benachrichtigungen auf diesem Gerät aus
export default defineEventHandler(async (event) => {
  const { endpoint } = await leseBody(event)
  if (typeof endpoint !== 'string' || !endpoint) throw fail(400, 'abo', 'Welches Gerät?')
  const eigene = await directusPerson<{ id: number }[]>(event, '/items/push_abos', {
    query: { fields: 'id', filter: { endpoint: { _eq: endpoint }, user_created: { _eq: '$CURRENT_USER' } }, limit: -1 },
  })
  for (const e of eigene) await directusPerson(event, `/items/push_abos/${e.id}`, { method: 'DELETE' })
  return { ok: true }
})
