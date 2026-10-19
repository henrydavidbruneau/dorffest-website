// POST /api/termine/:slug/anmeldung – Anmeldung zu einem Termin.
// Enthält optional auch "Was bringst du mit?".
// Speichert in Directus `anmeldungen` und schickt eine Bestätigung (Brevo).
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
  // optional: "Was bringst du mit?" (zweite Seite der Anmeldung)
  const mitbringen = termin.mitbringen_position !== 'aus' ? (text(body.mitbringen, 200) || null) : null

  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (!mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (!Number.isInteger(personen) || personen < 1 || personen > 10) throw fail(400, 'personen', 'Bitte gib an, mit wie vielen Personen du kommst (1–10).')
  if (body.einwilligung !== true) throw fail(400, 'einwilligung', 'Bitte stimm der Verarbeitung deiner Angaben zu.')
  if (termin.plaetze_frei !== null && personen > termin.plaetze_frei) {
    throw fail(409, 'ausgebucht', termin.plaetze_frei === 0 ? 'Leider sind schon alle Plätze vergeben.' : `Es sind nur noch ${termin.plaetze_frei} Plätze frei.`)
  }

  await pruefeTurnstile(event, body)
  await directusAnlegen('anmeldungen', { termin: termin.id, name, email: mail, personen, mitbringen })

  const wann = termin.beginn
    ? `${datumAusgeschrieben(termin.beginn)}${termin.uhrzeit_folgt ? ' (Uhrzeit folgt)' : `, ${uhrzeit(termin.beginn)} Uhr`}`
    : (termin.datum_text ?? 'Datum folgt')
  const wo = [termin.ort, termin.adresse].filter(Boolean).join(', ') || 'Ort folgt'
  await sendeMailStill({
    an: mail,
    betreff: `Du bist angemeldet: ${termin.titel}`,
    tags: ['anmeldung'],
    text: [
      `Hallo ${name},`,
      `schön, dass du dabei bist! Wir haben dich für „${termin.titel}“ angemeldet${personen > 1 ? ` – mit ${personen} Personen` : ''}.`,
      `Wann: ${wann}\nWo: ${wo}${mitbringen ? `\n${termin.mitbringen_frage ? `Deine Antwort auf „${termin.mitbringen_frage}“` : 'Du bringst mit'}: ${mitbringen}` : ''}`,
      `[Alle Infos zum Termin](${seitenUrl(event)}/termine/${termin.slug})`,
      'Du kannst doch nicht? Antworte einfach auf diese Mail, dann geben wir deinen Platz weiter.',
      GRUSS,
    ].join('\n\n'),
  })
  return { ok: true }
})
