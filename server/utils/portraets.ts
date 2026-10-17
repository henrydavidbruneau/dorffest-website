// Lesezugriff auf Porträts ("Fünf Fragen an …"). Heute aus server/data, später aus Directus (`portraets`).
import { portraets as platzhalter } from '../data/portraets'

export async function ladePortraets(ausgabe?: number): Promise<Portraet[]> {
  return platzhalter.filter(p => p.status === 'published' && (!ausgabe || p.ausgabe === ausgabe))
}
