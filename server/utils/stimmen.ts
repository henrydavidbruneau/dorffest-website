// Lesezugriff auf "Stimmen aus dem Verein" aus Directus (`stimmen`).

export async function ladeStimmen(): Promise<Stimme[]> {
  return directusListe<Stimme>('stimmen', { fields: '*', filter: VEROEFFENTLICHT, sort: 'sort,id' })
}
