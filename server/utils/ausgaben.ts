// Lesezugriff auf Dorfanzeiger-Ausgaben aus Directus (`ausgaben`).

/** alle Ausgaben, neueste zuerst (inkl. angekündigter, noch nicht erschienener) */
export async function ladeAusgaben(): Promise<Ausgabe[]> {
  return directusListe<Ausgabe>('ausgaben', { fields: '*', sort: '-nummer' })
}
