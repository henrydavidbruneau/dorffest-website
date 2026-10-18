// GET /api/plenum-erinnerung/bestaetigen|abmelden?id=…&sig=… – Links aus der Plenum-Mail.
// Leitet zurück auf /mitmachen, dort zeigt das Plenum einen Hinweis (?plenum=…).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'plenum-link', 20)
  const aktion = getRouterParam(event, 'aktion')
  if (aktion !== 'bestaetigen' && aktion !== 'abmelden') throw fail(404, 'link', 'Diesen Link gibt es nicht.')
  const { id, sig } = getQuery(event)
  if (!await pruefeSignatur(`plenum-${aktion}`, id, sig)) return sendRedirect(event, '/mitmachen?plenum=ungueltig#plenum')

  await directusServer(`/items/plenum_erinnerungen/${Number(id)}`, {
    method: 'PATCH',
    body: aktion === 'bestaetigen' ? { bestaetigt: true } : { abgemeldet_am: new Date().toISOString() },
  })
  return sendRedirect(event, `/mitmachen?plenum=${aktion === 'bestaetigen' ? 'bestaetigt' : 'abgemeldet'}#plenum`)
})
