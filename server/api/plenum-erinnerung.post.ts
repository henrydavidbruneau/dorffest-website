// POST /api/plenum-erinnerung – fürs Plenum anmelden / erinnern lassen.
// Vorerst nur Prüfung + Log. Später: Brevo-Liste "Plenum" (Double-Opt-in) bzw. Directus.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'plenum')
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const name = text(body.name, 80)
  const mail = email(body.email)
  const wie = body.wie === 'jedes' ? 'jedes' : 'naechstes'
  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (body.einwilligung !== true) throw fail(400, 'einwilligung', 'Bitte stimm zu, dass wir dir dazu schreiben dürfen.')

  console.info('[plenum]', { name, email: mail, wie })
  return { ok: true }
})
