// Rundbrief = Newsletter an die Brevo-Liste (NUXT_BREVO_NEWSLETTER_LISTE), geschrieben im Vereinsheim.
// Verschickt als Brevo-Kampagne, damit Brevo Abmeldungen und Zustellung übernimmt. Erkannt werden unsere
// Kampagnen am Namen („Rundbrief …“) – Tags erlaubt der Gratis-Tarif von Brevo nicht.
// HTML wie alle Mails (`mailHtml`), Abmelde-Link = Brevo-Platzhalter `{{ unsubscribe }}`.

const BREVO = 'https://api.brevo.com/v3'
const NAME_ANFANG = 'Rundbrief '

export function rundbriefKonfig() {
  const { brevoApiKey, brevoNewsletterListe } = useRuntimeConfig()
  const liste = Number(brevoNewsletterListe)
  const fehlt = [
    ...(brevoApiKey ? [] : ['NUXT_BREVO_API_KEY']),
    ...(Number.isInteger(liste) && liste > 0 ? [] : ['NUXT_BREVO_NEWSLETTER_LISTE (Zahl, z.B. 3)']),
  ]
  return { schluessel: brevoApiKey, liste, eingerichtet: !fehlt.length, fehlt }
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
    brevo<{ campaigns?: { id: number, name?: string, subject: string, sentDate?: string, statistics?: { globalStats?: { delivered?: number, uniqueViews?: number } } }[] }>('/emailCampaigns', {
      query: { type: 'classic', status: 'sent', limit: 50, sort: 'desc', statistics: 'globalStats' },
    }).catch(() => ({ campaigns: [] })),
  ])
  return {
    abonnenten: infos.uniqueSubscribers ?? infos.totalSubscribers ?? 0,
    verschickt: (kampagnen.campaigns ?? [])
      .filter(k => k.name?.startsWith(NAME_ANFANG))
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
      name: `${NAME_ANFANG}${datumLang(new Date().toISOString())}: ${betreff}`.slice(0, 250),
      subject: betreff,
      sender: { name: mailVonName, email: mailVon },
      replyTo: KONTAKT_MAIL,
      recipients: { listIds: [liste] },
      htmlContent: mailHtml(rundbriefText(text), { basis: mailBasis(), rubrik: 'Rundbrief', grosserGruss: true, abmelden: '{{ unsubscribe }}', vorschau: betreff }),
    },
  })
  await brevo(`/emailCampaigns/${kampagne.id}/sendNow`, { method: 'POST' })
  return kampagne.id
}
