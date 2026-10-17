// Platzhalter, bis Directus angebunden ist.
// Nur die erste Antwort steht im Design – die übrigen sind Entwürfe und müssen vom Verein geprüft werden.
const basis = { status: 'published', date_created: '2025-10-01T10:00:00Z', date_updated: null } as const

export const faq: Faq[] = [
  {
    ...basis,
    id: 1,
    sort: 1,
    frage: 'Muss ich Mitglied sein, um mitzumachen?',
    antwort: 'Nein. Zu unseren Festen und Treffen ist jede*r willkommen. Als Mitglied unterstützt du den Verein und entscheidest mit.',
  },
  {
    ...basis,
    id: 2,
    sort: 2,
    frage: 'Was kostet die Mitgliedschaft?',
    antwort: '[Entwurf] Den Mitgliedsbeitrag legen wir gerade fest. Er soll so niedrig sein, dass niemand wegen des Geldes draußen bleiben muss.',
  },
  {
    ...basis,
    id: 3,
    sort: 3,
    frage: 'Ich habe wenig Zeit – geht das trotzdem?',
    antwort: '[Entwurf] Klar. Du kannst einmal beim Aufbau anpacken, einen Kuchen backen oder einfach vorbeikommen. Jeder Beitrag zählt, egal wie groß.',
  },
  {
    ...basis,
    id: 4,
    sort: 4,
    frage: 'Ist der Verein politisch?',
    antwort: '[Entwurf] Uns verbindet ein respektvolles, solidarisches und demokratisches Miteinander. Rassismus und Ausgrenzung haben bei uns keinen Platz.',
  },
]
