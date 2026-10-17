// Lesezugriff auf FAQ. Heute aus server/data, später aus Directus (`faq`).
import { faq as platzhalter } from '../data/faq'

export async function ladeFaq(): Promise<Faq[]> {
  return platzhalter
    .filter(f => f.status === 'published')
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}
