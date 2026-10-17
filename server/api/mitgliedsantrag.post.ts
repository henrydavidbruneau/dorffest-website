// POST /api/mitgliedsantrag – Mitgliedsantrag.
// Vorerst nur Prüfung + Log. Später: in Directus `mitgliedsantraege` (Status `eingereicht`), Mail an den Vorstand.
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

  console.info('[mitgliedsantrag]', antrag)
  return { ok: true }
})
