// POST /api/vereinsheim/push  { endpoint, keys: { p256dh, auth }, geraet } – Benachrichtigungen auf diesem Gerät an.
// Dasselbe Gerät steht nur einmal drin (z.B. geteiltes Tablet: gehört dann der Person, die zuletzt eingeschaltet hat).
// Der Vorstand bekommt auch neue Mails im Kontakt-Postfach (`post`).
export default defineEventHandler(async (event) => {
  const abo = leseAbo(await leseBody(event))
  const vorstand = await istVorstand(event)
  const vorhanden = await directusServer<{ id: number }[]>('/items/push_abos', { query: { fields: 'id', filter: { endpoint: { _eq: abo.endpoint } }, limit: -1 } })
  for (const v of vorhanden) await directusServer(`/items/push_abos/${v.id}`, { method: 'DELETE' })
  await directusPerson(event, '/items/push_abos', { method: 'POST', body: { ...abo, ...(vorstand ? { post: true } : {}) } })
  return { ok: true, post: vorstand }
})
