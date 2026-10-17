// Alle Ziele der Seite an einer Stelle.
// TODO(Bruno): Infochannel-URL, Ziele von "Mitmachen" und "Gesucht-Zettel" bestätigen.
export const links = {
  infochannel: '#infochannel',
  mitmachen: '/#mitmachen',
  mitgliedWerden: '/ueber-uns#mitglied-werden',
  gesuchtZettel: '/#mitmachen',
  kontaktMail: 'kontakt@königsdorf-rückt-zusammen.de',
} as const

export interface NavLink {
  text: string
  to: string
}

export const hauptnavigation: NavLink[] = [
  { text: 'Startseite', to: '/' },
  { text: 'Termine', to: '/termine' },
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
      { text: 'Termine', to: '/termine' },
      { text: 'Gesucht-Zettel', to: links.gesuchtZettel },
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
