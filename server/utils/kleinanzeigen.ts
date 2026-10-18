// Lesezugriff auf Kleinanzeigen aus Directus (`kleinanzeigen`, max. 4 veröffentlichte).

export async function ladeKleinanzeigen(limit?: number): Promise<Kleinanzeige[]> {
  return directusListe<Kleinanzeige>('kleinanzeigen', { fields: '*', filter: VEROEFFENTLICHT, sort: 'sort,id', limit: limit ?? 4 })
}
