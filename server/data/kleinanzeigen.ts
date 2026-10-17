import { KONTAKT_MAIL } from '#shared/utils/kontakt'

// Platzhalter, bis Directus angebunden ist (Kleinanzeigen aus dem Design)
const basis = { status: 'published', date_created: '2025-10-01T10:00:00Z', date_updated: null } as const
const mail = (betreff: string) => `mailto:${KONTAKT_MAIL}?subject=${encodeURIComponent(betreff)}`

export const kleinanzeigen: Kleinanzeige[] = [
  { ...basis, id: 1, art: 'gesucht', titel: 'Kuchen', text: 'Für das Adventscafé, ein Blech reicht.', link_text: 'melde dich!', link: mail('Kleinanzeige: Kuchen') },
  { ...basis, id: 2, art: 'gesucht', titel: 'Technik', text: 'Boxen, Kabel, Licht für Konzerte.', link_text: 'melde dich!', link: mail('Kleinanzeige: Technik') },
  { ...basis, id: 3, art: 'biete', titel: 'Bühne', text: 'Deine Idee für einen Workshop? Wir helfen.', link_text: 'schreib uns', link: mail('Kleinanzeige: Bühne') },
  { ...basis, id: 4, art: 'gefunden', titel: 'Schal', text: 'Blau, beim Dorffest. Liegt im JuMa.', link_text: 'abholen', link: mail('Kleinanzeige: Schal') },
]
