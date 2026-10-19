// POST /api/plenum-erinnerung – fürs Plenum erinnern lassen (Double-Opt-in).
// Speichert in Directus `plenum_erinnerungen` (bestaetigt = false) und schickt einen
// Bestätigungslink. Erst nach dem Klick wird erinnert. Abmelden geht über den zweiten Link.
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
  await pruefeTurnstile(event, body)

  const neu = await directusAnlegen<{ id: number }>('plenum_erinnerungen', { name, email: mail, wie })
  if (!neu?.id || !linkSchluesselDa()) {
    console.warn('[plenum] Ohne NUXT_LINK_SECRET (oder ID) kein Bestätigungslink – Eintrag bleibt unbestätigt.')
    return { ok: true }
  }
  const basis = `${seitenUrl(event)}/api/plenum-erinnerung`
  const link = async (aktion: 'bestaetigen' | 'abmelden') => `${basis}/${aktion}?id=${neu.id}&sig=${await signiere(`plenum-${aktion}`, neu.id)}`
  await sendeMailStill({
    an: mail,
    betreff: 'Bitte bestätigen: Erinnerung ans Plenum',
    tags: ['plenum-doi'],
    rubrik: 'Plenum',
    abmelden: await link('abmelden'),
    text: [
      `Hallo ${name},`,
      '# Noch ein ==Klick!==',
      `schön, dass du zum Plenum kommen willst! Bitte bestätige kurz, dass wir dich ${wie === 'jedes' ? 'vor jedem Plenum' : 'vor dem nächsten Plenum'} erinnern dürfen:`,
      `[Ja, erinnert mich](${await link('bestaetigen')})`,
      'Du hast dich nicht angemeldet? Dann ignorier diese Mail einfach.',
      GRUSS,
    ].join('\n\n'),
  })
  return { ok: true }
})
