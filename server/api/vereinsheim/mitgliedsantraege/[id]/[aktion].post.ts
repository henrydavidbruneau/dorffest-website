// POST /api/vereinsheim/mitgliedsantraege/:id/annehmen|ablehnen (nur Vorstand – prüft Directus)
// Annehmen: Datensatz in `mitglieder` anlegen, Antrag verknüpfen, Willkommens-Mail.
// Ablehnen: braucht keine Begründung (Satzung), keine automatische Mail.

interface AntragRoh {
  status: string
  art: 'foerder' | 'regulaer'
  beitrag_jahr: number | string
  vorname: string
  nachname: string
  strasse: string
  plz: string
  ort: string
  email: string
  telefon: string | null
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const aktion = getRouterParam(event, 'aktion')
  if (aktion !== 'annehmen' && aktion !== 'ablehnen') throw fail(404, 'aktion', 'Nicht gefunden')
  const person = await ich(event)
  if (!person.vorstand) throw fail(403, 'rechte', 'Das darf nur der Vorstand.')
  const antrag = await directusPerson<AntragRoh>(event, `/items/mitgliedsantraege/${id}`)
  if (antrag.status !== 'eingereicht') throw fail(409, 'schon', 'Über diesen Antrag wurde schon entschieden.')
  const entschieden = { entschieden_am: new Date().toISOString(), entschieden_von: person.id }

  if (aktion === 'ablehnen') {
    await directusPerson(event, `/items/mitgliedsantraege/${id}`, { method: 'PATCH', body: { status: 'abgelehnt', ...entschieden } })
    return { ok: true }
  }

  const heute = new Date().toISOString().slice(0, 10)
  const mitglied = await directusPerson<{ id: number }>(event, '/items/mitglieder', {
    method: 'POST',
    body: {
      status: 'aktiv',
      art: antrag.art === 'regulaer' ? 'stimmberechtigt' : 'foerder',
      vorname: antrag.vorname,
      nachname: antrag.nachname,
      strasse: antrag.strasse,
      plz: antrag.plz,
      ort: antrag.ort,
      email: antrag.email,
      telefon: antrag.telefon,
      mitglied_seit: heute,
      beitrag_jahr: antrag.beitrag_jahr,
    },
  })
  await directusPerson(event, `/items/mitgliedsantraege/${id}`, { method: 'PATCH', body: { status: 'angenommen', mitglied: mitglied.id, ...entschieden } })
  const konto = await ladeVerein()
  await sendeMailStill({
    an: antrag.email,
    betreff: 'Willkommen bei Königsdorf rückt zusammen!',
    tags: ['mitglied-willkommen'],
    antwortAn: echteMail(person.email) ?? undefined,
    text: [
      `Hallo ${antrag.vorname},`,
      `der Vorstand hat deinen Antrag angenommen – du bist jetzt ${antrag.art === 'regulaer' ? 'stimmberechtigtes Mitglied' : 'Fördermitglied'} bei Königsdorf rückt zusammen e.V. Herzlich willkommen!`,
      `Falls noch nicht geschehen: Dein Beitrag geht an ${konto.kontoinhaber}, IBAN ${konto.iban}, Verwendungszweck „Mitgliedsbeitrag ${antrag.vorname} ${antrag.nachname}“.`,
      'Wir freuen uns, dich beim nächsten Plenum oder Fest zu sehen.',
      GRUSS,
    ].join('\n\n'),
  })
  return { ok: true, mitglied: mitglied.id }
})
