// POST /api/termine/:slug/anmeldung – Anmeldung zu einem Termin.
// Vorerst nur Prüfung + Log. Später: in Directus `anmeldungen` speichern, Bestätigungsmail über Brevo.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'anmeldung')
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const termin = await ladeTerminDetail(getRouterParam(event, 'slug') ?? '')
  if (!termin || !termin.anmeldung_aktiv) throw fail(404, 'keine_anmeldung', 'Für diesen Termin gibt es keine Anmeldung.')
  if (termin.vergangen) throw fail(410, 'vergangen', 'Dieser Termin liegt schon zurück.')

  const name = text(body.name, 80)
  const mail = email(body.email)
  const personen = Number(body.personen)
  const nachricht = text(body.nachricht, 500) || null

  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (!Number.isInteger(personen) || personen < 1 || personen > 10) throw fail(400, 'personen', 'Bitte gib an, mit wie vielen Personen du kommst (1–10).')
  if (body.einwilligung !== true) throw fail(400, 'einwilligung', 'Bitte stimm der Verarbeitung deiner Angaben zu.')
  if (termin.plaetze_frei !== null && personen > termin.plaetze_frei) {
    throw fail(409, 'ausgebucht', termin.plaetze_frei === 0 ? 'Leider sind schon alle Plätze vergeben.' : `Es sind nur noch ${termin.plaetze_frei} Plätze frei.`)
  }

  console.info('[anmeldung]', { termin: termin.slug, name, email: mail, personen, nachricht })
  return { ok: true }
})
