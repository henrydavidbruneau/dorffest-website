// POST /api/mitgliedsantrag – Mitgliedsantrag.
// Speichert in Directus `mitgliedsantraege` (Status `eingereicht`), schickt eine Eingangsbestätigung
// mit Beitrag und Konto und gibt dem Vorstand Bescheid.
import { KONTO } from '#shared/utils/kontakt'
export default defineEventHandler(async (event) => {
  rateLimit(event, 'mitgliedsantrag', 3)
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }

  const art = body.art === 'regulaer' ? 'regulaer' : body.art === 'foerder' ? 'foerder' : null
  if (!art) throw fail(400, 'art', 'Bitte wähl eine Mitgliedsart.')
  const beitrag = beitragFuer(body.beitrag_stufe)
  if (!beitrag || beitrag.art !== art) throw fail(400, 'beitrag', 'Bitte wähl einen Beitrag.')

  let beitragJahr = beitrag.monat * 12
  if (beitrag.mehrMoeglich && body.beitrag_jahr !== undefined && body.beitrag_jahr !== '') {
    const wunsch = Number(body.beitrag_jahr)
    if (!Number.isFinite(wunsch) || wunsch < beitragJahr || wunsch > 10000) throw fail(400, 'beitrag', `Der Beitrag muss mindestens ${beitragJahr} € im Jahr sein.`)
    beitragJahr = Math.round(wunsch)
  }

  if (art === 'regulaer' && body.plenum_besucht !== true) {
    throw fail(400, 'plenum', 'Reguläres Mitglied wirst du, wenn du schon einmal beim Plenum dabei warst. Bis dahin kannst du Fördermitglied werden.')
  }

  const antrag = {
    art,
    beitrag_stufe: beitrag.stufe,
    beitrag_jahr: beitragJahr,
    vorname: text(body.vorname, 80),
    nachname: text(body.nachname, 80),
    strasse: text(body.strasse, 120),
    plz: text(body.plz, 10),
    ort: text(body.ort, 80),
    email: email(body.email),
    telefon: text(body.telefon, 40) || null,
    plenum_besucht: art === 'regulaer' ? true : null,
    nachricht: text(body.nachricht, 1000) || null,
  }

  if (!antrag.vorname || !antrag.nachname) throw fail(400, 'name', 'Bitte gib deinen Vor- und Nachnamen an.')
  if (!antrag.strasse || !antrag.ort) throw fail(400, 'adresse', 'Bitte gib deine Adresse an.')
  if (!/^\d{5}$/.test(antrag.plz)) throw fail(400, 'plz', 'Bitte gib eine fünfstellige Postleitzahl an.')
  if (!antrag.email) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (body.satzung !== true) throw fail(400, 'satzung', 'Bitte bestätige, dass du die Satzung gelesen hast.')
  if (body.einwilligung !== true) throw fail(400, 'einwilligung', 'Bitte stimm der Verarbeitung deiner Angaben zu.')

  await pruefeTurnstile(event, body)
  // Satzung gilt mit dem Antrag als anerkannt (§ 4) – Zeitpunkt als Textform-Nachweis
  await directusAnlegen('mitgliedsantraege', { ...antrag, satzung_anerkannt_am: new Date().toISOString() })

  const artText = art === 'foerder' ? 'Fördermitglied' : 'reguläres Mitglied'
  const betrag = beitrag.art === 'foerder' ? `${beitrag.monat} € im Monat (${beitragJahr} € im Jahr)` : `${beitragJahr} € im Jahr`
  const zweck = `Mitgliedsbeitrag ${antrag.vorname} ${antrag.nachname}`
  await sendeMailStill({
    an: antrag.email,
    betreff: 'Dein Mitgliedsantrag ist da',
    tags: ['mitgliedsantrag'],
    text: [
      `Hallo ${antrag.vorname},`,
      `danke für deinen Antrag – du willst ${artText} bei Königsdorf rückt zusammen e.V. werden. Wie schön!`,
      'Der Vorstand schaut sich den Antrag an und meldet sich bei dir, sobald er entschieden hat.',
      `Dein Beitrag: ${betrag}\nKonto: ${KONTO.inhaber}\nIBAN: ${KONTO.iban}\nVerwendungszweck: ${zweck}`,
      'Am einfachsten richtest du einen Dauerauftrag ein. Fragen? Antworte einfach auf diese Mail.',
      GRUSS,
    ].join('\n\n'),
  })
  await mailAnVerein(
    `Neuer Mitgliedsantrag: ${antrag.vorname} ${antrag.nachname} (${artText})`,
    [
      `${antrag.vorname} ${antrag.nachname}, ${antrag.strasse}, ${antrag.plz} ${antrag.ort}\n${antrag.email}${antrag.telefon ? ` · ${antrag.telefon}` : ''}`,
      `Beitrag: ${betrag}${art === 'regulaer' ? '\nWar laut eigener Angabe schon beim Plenum.' : ''}`,
      antrag.nachricht ? `Nachricht: ${antrag.nachricht}` : '',
      'Entscheiden im Vereinsheim bzw. in Directus unter „mitgliedsantraege“.',
    ].filter(Boolean).join('\n\n'),
    antrag.email,
  )
  return { ok: true }
})
