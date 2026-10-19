// Netlify Scheduled Function: jeden Morgen fragen, ob bald Plenum ist. Die Server-Route
// entscheidet und verschickt die Erinnerungen (Nitro kann auf Netlify selbst keine Zeitpläne).
// Läuft nur auf dem veröffentlichten Produktions-Deploy, nicht in Deploy-Previews.
export default async (_anfrage, context) => {
  const basis = context?.site?.url || process.env.URL
  const schluessel = process.env.NUXT_LINK_SECRET
  if (!basis || !schluessel) {
    console.error('[plenum-erinnerung] Adresse oder NUXT_LINK_SECRET fehlt')
    return
  }
  const antwort = await fetch(`${basis}/api/plenum-erinnerung/automatisch`, {
    method: 'POST',
    headers: { authorization: `Bearer ${schluessel}` },
  })
  console.log('[plenum-erinnerung]', antwort.status, await antwort.text())
}

// 7 Uhr UTC = 8 bzw. 9 Uhr in Königsdorf
export const config = { schedule: '0 7 * * *' }
