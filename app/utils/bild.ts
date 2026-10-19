// Bilder aus Directus haben eine Datei-ID statt eines Pfads → @nuxt/image-Provider `directus`
// (Basis /bilder/, siehe nuxt.config.ts). Lokale Bilder (/fotos/…) laufen wie bisher.
const DATEI_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function bildAnbieter(src: string | null | undefined): 'directus' | undefined {
  return src && DATEI_ID.test(src) ? 'directus' : undefined
}

/** Feste Bild-Adresse, z.B. fürs Vorschaubild beim Teilen (og:image) */
export function bildUrl(src: string, breite = 1200): string {
  return bildAnbieter(src) ? `/bilder/${src}?width=${breite}&format=jpg&quality=80` : src
}
