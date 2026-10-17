// Lesezugriff auf Kleinanzeigen. Heute aus server/data, später aus Directus (`kleinanzeigen`).
import { kleinanzeigen as platzhalter } from '../data/kleinanzeigen'

export async function ladeKleinanzeigen(limit?: number): Promise<Kleinanzeige[]> {
  const liste = platzhalter.filter(k => k.status === 'published')
  return limit ? liste.slice(0, limit) : liste
}
