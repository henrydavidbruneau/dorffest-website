// Platzhalter, bis Directus angebunden ist. Beispiel-Einträge – vor dem Livegang löschen.
const basis = { status: 'published', date_updated: null } as const

export const leserbriefe: Leserbrief[] = [
  { ...basis, id: 1, date_created: '2025-09-12T18:00:00Z', name: 'Beispiel: Anwohnerin', text: 'Danke für das schöne Fest! Ich wohne seit 30 Jahren hier und habe an einem Nachmittag mehr Nachbar*innen kennengelernt als in den letzten zehn Jahren.' },
  { ...basis, id: 2, date_created: '2025-09-20T09:30:00Z', name: 'Beispiel: Familie aus dem Neubaugebiet', text: 'Unsere Kinder fragen jeden Tag, wann wieder Dosenwerfen ist. Bitte nächstes Jahr wieder!' },
  { ...basis, id: 3, date_created: '2025-10-02T16:10:00Z', name: 'Beispiel: Leser', text: 'Gibt es das Rezept vom Dorfsüppchen irgendwo? Ich hätte gern einen ganzen Topf davon.' },
]

export const ideen: Idee[] = [
  { ...basis, id: 1, date_created: '2025-10-01T10:00:00Z', name: 'Beispiel', text: 'Ein offener Spieleabend für alle Generationen.' },
  { ...basis, id: 2, date_created: '2025-10-03T10:00:00Z', name: 'Beispiel', text: 'Eine Bank mit Tauschregal für Bücher.' },
  { ...basis, id: 3, date_created: '2025-10-05T10:00:00Z', name: 'Beispiel', text: 'Gemeinsam Obstbäume am Feldrand pflanzen.' },
]
