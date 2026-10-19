/** Directus-Singleton `verein`: Kontakt, Konto, Infochannel */
export interface Verein {
  kontakt_email: string
  kontoinhaber: string
  iban: string
  infochannel_url: string
  naechstes_dorffest: string | null
}
