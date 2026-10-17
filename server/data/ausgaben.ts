// Platzhalter, bis Directus angebunden ist (Dorfanzeiger-Ausgaben aus dem Design)
const basis = { status: 'published', date_created: '2025-03-01T10:00:00Z', date_updated: null } as const

export const ausgaben: Ausgabe[] = [
  { ...basis, id: 4, nummer: 4, jahreszeit: 'winter', jahr: 2025, motto: null, bild: null, bild_alt: null, erschienen_am: null },
  { ...basis, id: 3, nummer: 3, jahreszeit: 'herbst', jahr: 2025, motto: 'Das erste Dorffest', bild: '/fotos/dorffest-buffet.webp', bild_alt: 'Das Dorfbuffet', erschienen_am: '2025-09-15' },
  { ...basis, id: 2, nummer: 2, jahreszeit: 'sommer', jahr: 2025, motto: 'Die letzte Planungsrunde', bild: '/fotos/ausgabe-2-sommer.webp', bild_alt: 'Menschen beim Improtheater auf einer Bühne mit blauem Vorhang.', erschienen_am: '2025-06-15' },
  { ...basis, id: 1, nummer: 1, jahreszeit: 'fruehling', jahr: 2025, motto: 'Wie alles anfing', bild: '/fotos/verein-siebdruck.webp', bild_alt: 'Hände an einer Siebdruckstation.', erschienen_am: '2025-03-20' },
]
