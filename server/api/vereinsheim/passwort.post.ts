// POST /api/vereinsheim/passwort – eigenes Passwort ändern (altes Passwort zur Sicherheit prüfen)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-passwort', 5)
  const body = await leseBody(event)
  const alt = typeof body.alt === 'string' ? body.alt : ''
  const neu = typeof body.neu === 'string' ? body.neu : ''
  if (neu.length < 10) throw fail(400, 'kurz', 'Das neue Passwort braucht mindestens 10 Zeichen.')
  const person = await ich(event)
  if (!person.email) throw fail(400, 'email', 'Deinem Konto fehlt eine E-Mail-Adresse.')
  await anmelden(event, person.email, alt).catch(() => {
    throw fail(401, 'falsch', 'Das bisherige Passwort stimmt nicht.')
  })
  await directusPerson(event, '/users/me', { method: 'PATCH', body: { password: neu } })
  // Directus beendet beim Passwortwechsel die Sitzungen → gleich neu anmelden
  await anmelden(event, person.email, neu)
  return { ok: true }
})
