// POST /api/vereinsheim/login – mit Benutzername oder E-Mail + Passwort.
// Das Passwort geht nur durch diese Route zu Directus; zurück kommen httpOnly-Cookies.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-login', 10)
  const body = await leseBody(event)
  const kennung = text(body.kennung, 254).toLowerCase()
  const passwort = typeof body.passwort === 'string' ? body.passwort : ''
  if (!kennung || !passwort) throw fail(400, 'leer', 'Bitte Benutzername und Passwort eingeben.')
  // Bot-Hürde vor der Benutzernamen-Suche – bremst Durchprobieren
  await pruefeTurnstile(event, body)

  // Bewusst gleiche Meldung: verrät nicht, ob es den Benutzernamen gibt
  const falsch = () => fail(401, 'falsch', 'Benutzername oder Passwort stimmt nicht.')
  const email = await loginEmail(kennung)
  if (!email) throw falsch()
  await anmelden(event, email, passwort).catch(() => {
    throw falsch()
  })
  return { ok: true }
})
