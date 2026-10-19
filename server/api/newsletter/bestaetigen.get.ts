// GET /api/newsletter/bestaetigen?email=…&sig=… – Link aus der Bestätigungsmail:
// Adresse in die Brevo-Newsletterliste aufnehmen, dann Danke-Seite (/newsletter/danke).
export default defineEventHandler(async (event) => {
  rateLimit(event, 'newsletter-link', 20)
  const { email: adresse, sig } = getQuery(event)
  if (!await pruefeSignaturWert('newsletter', adresse, sig)) return sendRedirect(event, '/newsletter/danke?link=ungueltig')

  const { brevoApiKey, brevoNewsletterListe } = useRuntimeConfig()
  const liste = Number(brevoNewsletterListe)
  if (!brevoApiKey || !Number.isInteger(liste) || liste <= 0) {
    console.info(`[newsletter] ${adresse} bestätigt – Brevo-Key oder Listen-ID fehlt, nur geloggt.`)
  }
  else {
    await $fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': brevoApiKey, 'accept': 'application/json' },
      body: { email: adresse, listIds: [liste], updateEnabled: true },
    }).catch(e => console.error('[newsletter] Brevo:', e?.data ?? e))
  }
  return sendRedirect(event, '/newsletter/danke')
})
