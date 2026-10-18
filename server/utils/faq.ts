// Lesezugriff auf FAQ aus Directus (`faq`).

export async function ladeFaq(): Promise<Faq[]> {
  return directusListe<Faq>('faq', { fields: '*', filter: VEROEFFENTLICHT, sort: 'sort,id' })
}
