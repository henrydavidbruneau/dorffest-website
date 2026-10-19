// PATCH /api/vereinsheim/konto – eigenen Namen ändern (Passwort: /api/vereinsheim/passwort)
export default defineEventHandler(async (event) => {
  const body = await leseBody(event)
  const daten = { first_name: text(body.first_name, 80) || null, last_name: text(body.last_name, 80) || null }
  await directusPerson(event, '/users/me', { method: 'PATCH', body: daten })
  return { ok: true }
})
