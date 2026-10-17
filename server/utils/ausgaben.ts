// Lesezugriff auf Dorfanzeiger-Ausgaben. Heute aus server/data, später aus Directus (`ausgaben`).
import { ausgaben as platzhalter } from '../data/ausgaben'

/** alle Ausgaben, neueste zuerst (inkl. angekündigter, noch nicht erschienener) */
export async function ladeAusgaben(): Promise<Ausgabe[]> {
  return platzhalter.filter(a => a.status === 'published').sort((a, b) => b.nummer - a.nummer)
}
