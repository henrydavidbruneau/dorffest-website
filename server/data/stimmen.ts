// Platzhalter, bis Directus angebunden ist ("Stimmen aus dem Verein").
// Nur das Zitat von Thomas steht im Design – die anderen bitte vom Verein einholen.
const basis = { status: 'published', date_created: '2025-10-01T10:00:00Z', date_updated: null } as const

export const stimmen: Stimme[] = [
  { ...basis, id: 1, sort: 1, name: 'Thomas', zitat: '„Das Dorf soll weiterhin lebendig bleiben und Menschen sollen hier wirklich zusammenkommen :)“', bild: '/fotos/stimme-thomas.webp', bild_alt: 'Thomas vor kahlen Bäumen' },
  { ...basis, id: 2, sort: 2, name: 'Kathie', zitat: '[Zitat folgt]', bild: '/fotos/stimme-kathie.webp', bild_alt: 'Kathie in London' },
  { ...basis, id: 3, sort: 3, name: 'Ele', zitat: '[Zitat folgt]', bild: '/fotos/stimme-ele.webp', bild_alt: 'Ele vor einer grauen Wand' },
  { ...basis, id: 4, sort: 4, name: 'Bruno', zitat: '[Zitat folgt]', bild: '/fotos/stimme-bruno.webp', bild_alt: 'Bruno vor dunklem Hintergrund' },
]
