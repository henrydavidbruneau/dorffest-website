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
  const neu = await directusAnlegen<{ id?: number }>('anmeldungen', { termin: termin.id, name, email: mail, personen, mitbringen })
  const austragen = neu?.id && linkSchluesselDa()
    ? `${seitenUrl(event)}/api/termine/austragen?id=${neu.id}&sig=${await signiere('anmeldung-austragen', neu.id)}`
    : null
  // zweite Box „über weitere Aktionen informieren“: Bestätigungslink für den Rundbrief gleich mit in die Mail (Double-Opt-in)
  const rundbrief = body.rundbrief === true && linkSchluesselDa()
    ? `${seitenUrl(event)}/api/newsletter/bestaetigen?email=${encodeURIComponent(mail)}&sig=${await signiere('newsletter', mail)}`
    : null

  const wann = termin.beginn
    ? `${datumAusgeschrieben(termin.beginn)}${termin.uhrzeit_folgt ? ' (Uhrzeit folgt)' : `, ${uhrzeit(termin.beginn)} Uhr`}`
    : (termin.datum_text ?? 'Datum folgt')
  const wo = [termin.ort, termin.adresse].filter(Boolean).join(', ') || 'Ort folgt'
  const kalender = kalenderLinks(termin, seitenUrl(event))
  await sendeMailStill({
    an: mail,
    betreff: `Du bist angemeldet: ${termin.titel}`,
    tags: ['anmeldung'],
    rubrik: 'Anmeldung',
    text: [
      `Hallo ${name},`,
      '# Du bist ==dabei!==',
      `schön, dass du dabei bist! Wir haben dich für „${termin.titel}“ angemeldet${personen > 1 ? ` – mit ${personen} Personen` : ''}.`,
      `Wann: ${wann}\nWo: ${wo}${mitbringen ? `\n${termin.mitbringen_frage ? `Deine Antwort auf „${termin.mitbringen_frage}“` : 'Du bringst mit'}: ${mitbringen}` : ''}`,
      ...(kalender.ics
        ? ['**Zum Kalender hinzufügen:**', `[Google](${kalender.google}) · [Outlook](${kalender.outlook}) · [Apple / .ics](${kalender.ics})`]
        : [`[Alle Infos zum Termin](${seitenUrl(event)}/termine/${termin.slug})`]),
      austragen ? `Du kannst doch nicht? [Klick hier, um dich wieder auszutragen](${austragen}).` : 'Du kannst doch nicht? Antworte einfach auf diese Mail, dann geben wir deinen Platz weiter.',
      ...(rundbrief ? ['## Und unser ==Rundbrief?==', 'Du willst auch von weiteren Aktionen hören – schön! Bitte bestätige noch kurz, dass wir dir unseren Rundbrief schicken dürfen:', `[Ja, schickt mir den Rundbrief](${rundbrief})`] : []),
      GRUSS,
    ].join('\n\n'),
  })
  return { ok: true }
})
