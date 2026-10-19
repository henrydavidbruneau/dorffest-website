// Von App und Server genutzt
export const KONTAKT_MAIL = 'kontakt@koenigsdorf-rueckt-zusammen.de'

/** Gruß unter Mails an Nachbar*innen (auch für die Rundmail-Vorschau im Vereinsheim) */
export const GRUSS = `Bis bald im Dorf!\nKönigsdorf rückt zusammen e.V.\n${KONTAKT_MAIL}`

/** Vereinskonto (für Mitgliedsbeiträge) */
export const KONTO = {
  inhaber: 'RücktZusammen',
  iban: 'DE38 3705 0299 0141 2876 98',
} as const

/** Ersatzwerte, falls Directus nicht erreichbar ist (gepflegt wird in Directus: `verein`) */
export const VEREIN_STANDARD = {
  kontakt_email: KONTAKT_MAIL,
  kontoinhaber: KONTO.inhaber,
  iban: KONTO.iban,
  infochannel_url: 'https://chat.whatsapp.com/HtfZqwqUXpu6Xu9A4nO7PV?mode=gi_t',
  naechstes_dorffest: '2027-09-07',
}
