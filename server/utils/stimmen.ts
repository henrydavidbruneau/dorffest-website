// Lesezugriff auf "Stimmen aus dem Verein". Heute aus server/data, später aus Directus (`stimmen`).
import { stimmen as platzhalter } from '../data/stimmen'

export async function ladeStimmen(): Promise<Stimme[]> {
  return platzhalter
    .filter(s => s.status === 'published')
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}
