// Rundbrief = Newsletter an die Brevo-Liste (NUXT_BREVO_NEWSLETTER_LISTE), geschrieben im Vereinsheim.
// Verschickt als Brevo-Kampagne (Tag „rundbrief“), damit Brevo Abmeldungen und Zustellung übernimmt.
// HTML wie alle Mails (`mailHtml`), Abmelde-Link = Brevo-Platzhalter `{{ unsubscribe }}`.

const BREVO = 'https://api.brevo.com/v3'
export const RUNDBRIEF_TAG = 'rundbrief'

export function rundbriefKonfig() {
  const { brevoApiKey, brevoNewsletterListe } = useRuntimeConfig()
  const liste = Number(brevoNewsletterListe)
  return { schluessel: brevoApiKey, liste, eingerichtet: !!brevoApiKey && Number.isInteger(liste) && liste > 0 }
}

function brevo<T>(pfad: string, optionen: { method?: 'GET' | 'POST', body?: Record<string, unknown>, query?: Record<string, unknown> } = {}) {
  return $fetch<T>(`${BREVO}${pfad}`, { ...optionen, headers: { 'api-key': rundbriefKonfig().schluessel, 'accept': 'application/json' } })
}

/** Text des Rundbriefs: eigener Text + Gruß (wie bei allen Mails) */
export const rundbriefText = (text: string) => `${text.trim()}\n\n${GRUSS}`

export async function rundbriefStand() {
  const { liste } = rundbriefKonfig()
  const [infos, kampagnen] = await Promise.all([
    brevo<{ uniqueSubscribers?: number, totalSubscribers?: number }>(`/contacts/lists/${liste}`),
    brevo<{ campaigns?: { id: number, subject: string, tag?: string, sentDate?: string, statistics?: { globalStats?: { delivered?: number, uniqueViews?: number } } }[] }>('/emailCampaigns', {
      query: { type: 'classic', status: 'sent', limit: 50, sort: 'desc', statistics: 'globalStats' },
    }).catch(() => ({ campaigns: [] })),
  ])
  return {
    abonnenten: infos.uniqueSubscribers ?? infos.totalSubscribers ?? 0,
    verschickt: (kampagnen.campaigns ?? [])
      .filter(k => k.tag === RUNDBRIEF_TAG)
      .slice(0, 10)
      .map(k => ({ id: k.id, betreff: k.subject, am: k.sentDate ?? null, zugestellt: k.statistics?.globalStats?.delivered ?? null, geoeffnet: k.statistics?.globalStats?.uniqueViews ?? null })),
  }
}

export async function rundbriefVerschicken(betreff: string, text: string) {
  const { liste } = rundbriefKonfig()
  const { mailVon, mailVonName } = useRuntimeConfig()
  const kampagne = await brevo<{ id: number }>('/emailCampaigns', {
    method: 'POST',
    body: {
      name: `Rundbrief ${datumLang(new Date().toISOString())}: ${betreff}`.slice(0, 250),
      subject: betreff,
      sender: { name: mailVonName, email: mailVon },
      replyTo: KONTAKT_MAIL,
      tag: RUNDBRIEF_TAG,
      recipients: { listIds: [liste] },
      htmlContent: mailHtml(rundbriefText(text), { basis: mailBasis(), rubrik: 'Rundbrief', grosserGruss: true, abmelden: '{{ unsubscribe }}', vorschau: betreff }),
    },
  })
  await brevo(`/emailCampaigns/${kampagne.id}/sendNow`, { method: 'POST' })
  return kampagne.id
}
