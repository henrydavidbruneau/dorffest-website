/** Titel → Adresse: „Königsdorf singt!“ → „koenigsdorf-singt“ */
export function slugAus(text: string): string {
  return text.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

/** CSV mit Semikolon (öffnet in Excel/Numbers auf Deutsch direkt richtig) herunterladen */
export function csvHerunterladen(dateiname: string, kopf: string[], zeilen: (string | number | null | undefined)[][]) {
  const zelle = (w: string | number | null | undefined) => `"${String(w ?? '').replace(/"/g, '""')}"`
  const inhalt = [kopf, ...zeilen].map(z => z.map(zelle).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + inhalt], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: dateiname })
  a.click()
  URL.revokeObjectURL(url)
}

/** Euro-Betrag „12,50 €“ (Directus liefert Dezimalzahlen als Text) */
export function euro(wert: number | string | null | undefined) {
  const n = Number(wert ?? 0)
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}
