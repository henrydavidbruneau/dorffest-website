// POST /api/vorschlaege – eigene Idee / Angebot einreichen (z.B. fürs Dorffest).
// Speichert in Directus `vorschlaege` (Status `neu`) und gibt dem Verein Bescheid.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vorschlag', 5)
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const vorschlag = {
    name: text(body.name, 80),
    email: email(body.email),
    idee: typeof body.idee === 'string' ? body.idee.trim().slice(0, 2000) : '',
    dorffest: body.dorffest === true,
    selbst_mitmachen: body.selbst_mitmachen === true,
  }
  if (!vorschlag.name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!vorschlag.email) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (vorschlag.idee.length < 10) throw fail(400, 'idee', 'Erzähl uns noch ein bisschen mehr über deine Idee.')

  await pruefeTurnstile(event, body)
  await directusAnlegen('vorschlaege', vorschlag)
  await mailAnVerein(
    `Neuer Vorschlag von ${vorschlag.name}${vorschlag.dorffest ? ' (Dorffest)' : ''}`,
    [
      vorschlag.idee,
      `${vorschlag.name} <${vorschlag.email}>${vorschlag.selbst_mitmachen ? ' – will selbst mitmachen' : ''}`,
      'Antworten geht direkt an die Person. Alle Vorschläge liegen in Directus unter „vorschlaege“.',
    ].join('\n\n'),
    vorschlag.email,
  )
  return { ok: true }
})
