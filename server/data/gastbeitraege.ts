// Platzhalter: Einladungen für Gastbeiträge. Später Directus `gastbeitrag_einladungen`,
// angelegt im Vereinsheim („Link erstellen“). Testen: /gastbeitrag/beispiel-einladung
import type { GastbeitragEinladung } from '#shared/types/gastbeitrag'

export const gastbeitragEinladungen: GastbeitragEinladung[] = [
  {
    id: 1,
    schluessel: 'beispiel-einladung',
    name: 'Marta',
    ressort: 'dorffunk',
    gueltig_bis: '2027-06-30T23:59:59+02:00',
    mehrfach: false,
    status: 'offen',
    date_created: '2026-10-18T10:00:00+02:00',
  },
  {
    id: 2,
    schluessel: 'beispiel-schon-eingereicht',
    name: 'Jonas',
    ressort: null,
    gueltig_bis: null,
    mehrfach: false,
    status: 'eingereicht',
    date_created: '2026-10-01T10:00:00+02:00',
  },
]
