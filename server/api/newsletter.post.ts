// POST /api/newsletter – für den Newsletter eintragen (Double-Opt-in).
// Schickt einen signierten Bestätigungslink; erst danach kommt die Adresse in die Brevo-Liste.
// Antwortet immer { ok: true } – verrät nicht, wer schon eingetragen ist.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'newsletter', 5)
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true }
  const mail = email(body.email)
  if (!mail) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  await pruefeTurnstile(event, body)
  if (!linkSchluesselDa()) {
    console.warn('[newsletter] Ohne NUXT_LINK_SECRET kein Bestätigungslink – nichts verschickt.')
    return { ok: true }
  }
  const link = `${seitenUrl(event)}/api/newsletter/bestaetigen?email=${encodeURIComponent(mail)}&sig=${await signiere('newsletter', mail)}`
  await sendeMailStill({
    an: mail,
    betreff: 'Bitte bestätigen: Neuigkeiten aus Königsdorf',
    tags: ['newsletter-doi'],
    text: [
      'Hallo!',
      'Schön, dass du von uns hören willst. Bitte bestätige kurz deine Adresse – dann bekommst du neue Termine und Neuigkeiten aus dem Dorf:',
      link,
      'Du hast dich nicht eingetragen? Dann ignorier diese Mail einfach.',
      GRUSS,
    ].join('\n\n'),
  })
  return { ok: true }
})
