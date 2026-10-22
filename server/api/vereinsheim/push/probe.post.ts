// POST /api/vereinsheim/push/probe  { endpoint } – Probe-Benachrichtigung an dieses Gerät
export default defineEventHandler(async (event) => {
  if (!pushKonfig().eingerichtet) throw fail(503, 'push', 'Push ist auf dem Server noch nicht eingerichtet (NUXT_VAPID_*).')
  rateLimit(event, 'push-probe', 5)
  const { endpoint } = await leseBody(event)
  if (typeof endpoint !== 'string' || !endpoint) throw fail(400, 'abo', 'Welches Gerät?')
  const abos = await directusPerson<PushAbo[]>(event, '/items/push_abos', {
    query: { fields: 'id,endpoint,p256dh,auth', filter: { endpoint: { _eq: endpoint }, user_created: { _eq: '$CURRENT_USER' } }, limit: 1 },
  })
  if (!abos.length) throw fail(404, 'abo', 'Auf diesem Gerät sind Benachrichtigungen noch nicht an.')
  const angekommen = await sendePush(abos, { titel: 'Hallo aus dem Vereinsheim!', text: 'So sehen Benachrichtigungen aus. Klappt.', url: '/vereinsheim/konto', kennung: 'probe' })
  if (!angekommen) throw fail(502, 'push', 'Die Probe kam nicht an. Schalte Benachrichtigungen einmal aus und wieder an.')
  return { ok: true }
})
