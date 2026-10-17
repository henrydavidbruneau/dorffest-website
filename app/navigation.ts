import { KONTAKT_MAIL } from '#shared/utils/kontakt'

// Alle Ziele der Seite an einer Stelle.
export const links = {
  infochannel: 'https://chat.whatsapp.com/HtfZqwqUXpu6Xu9A4nO7PV?mode=gi_t',
  // TODO: Mitmachen-Seite/-Bereich wird später gebaut
  mitmachen: '/#mitmachen',
  mitgliedWerden: '/ueber-uns#mitglied-werden',
  mitgliedsantrag: '/mitglied-werden',
  kontaktMail: KONTAKT_MAIL,
} as const

export interface NavLink {
  text: string
  to: string
}

export const hauptnavigation: NavLink[] = [
  { text: 'Startseite', to: '/' },
  { text: 'Termine', to: '/#was-kommt' },
  { text: 'Neuigkeiten', to: '/dorfanzeiger' },
  { text: 'Über uns', to: '/ueber-uns' },
]

export const fussnavigation: { titel: string, links: NavLink[] }[] = [
  {
    titel: 'Verein',
    links: [
      { text: 'Über uns', to: '/ueber-uns' },
      { text: 'Satzung', to: '/satzung' },
      { text: 'Mitglied werden', to: links.mitgliedWerden },
    ],
  },
  {
    titel: 'Mitmachen',
    links: [
      { text: 'Termine', to: '/#was-kommt' },
      { text: 'Infochannel', to: links.infochannel },
    ],
  },
  {
    titel: 'Rechtliches',
    links: [
      { text: 'Kontakt', to: '/kontakt' },
      { text: 'Impressum', to: '/impressum' },
      { text: 'Datenschutz', to: '/datenschutz' },
    ],
  },
]
