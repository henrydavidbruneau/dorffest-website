/** Ab so wenigen freien Plätzen zeigt die Website die Zahl (mit Dringlichkeit) – vorher nicht */
export const PLAETZE_KNAPP_AB = 20

/** sind bei einem begrenzten Termin nur noch wenige (aber noch Plätze) frei? */
export function plaetzeKnapp(plaetzeFrei: number | null): boolean {
  return plaetzeFrei !== null && plaetzeFrei > 0 && plaetzeFrei <= PLAETZE_KNAPP_AB
}
