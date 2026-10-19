// PATCH /api/vereinsheim/konto – eigenen Namen und Profilbild ändern (Passwort: /api/vereinsheim/passwort)
// { first_name?, last_name?, avatar? } – avatar = Datei-ID aus dem Upload oder null (entfernen)
export default defineEventHandler(async (event) => {
  const body = await leseBody(event)
  const daten: Record<string, unknown> = {}
  if ('first_name' in body) daten.first_name = text(body.first_name, 80) || null
  if ('last_name' in body) daten.last_name = text(body.last_name, 80) || null
  if ('avatar' in body) {
    if (body.avatar !== null && !(typeof body.avatar === 'string' && /^[0-9a-f-]{36}$/.test(body.avatar))) throw fail(400, 'avatar', 'Das Bild ist ungültig.')
    daten.avatar = body.avatar
  }
  if (!Object.keys(daten).length) throw fail(400, 'leer', 'Nichts zu ändern.')
  await directusPerson(event, '/users/me', { method: 'PATCH', body: daten })
  return { ok: true }
})
