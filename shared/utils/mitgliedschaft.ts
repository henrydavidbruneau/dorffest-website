// Mitgliedsarten und Beiträge – von Formular (Anzeige) und Server (Prüfung) gemeinsam genutzt
export type Mitgliedsart = 'foerder' | 'regulaer'
export type BeitragStufe = 'standard' | 'ermaessigt' | 'foerder_3' | 'foerder_5' | 'foerder_10'

export interface BeitragOption {
  stufe: BeitragStufe
  art: Mitgliedsart
  /** Euro pro Monat */
  monat: number
  titel: string
  hinweis?: string
  /** Betrag darf erhöht werden ("24 € +") */
  mehrMoeglich?: boolean
}

export const BEITRAEGE: BeitragOption[] = [
  { stufe: 'foerder_3', art: 'foerder', monat: 3, titel: '3 € im Monat' },
  { stufe: 'foerder_5', art: 'foerder', monat: 5, titel: '5 € im Monat' },
  { stufe: 'foerder_10', art: 'foerder', monat: 10, titel: '10 € im Monat' },
  { stufe: 'standard', art: 'regulaer', monat: 2, titel: '24 € im Jahr', hinweis: '2 € im Monat – gern auch mehr', mehrMoeglich: true },
  { stufe: 'ermaessigt', art: 'regulaer', monat: 1, titel: '12 € im Jahr', hinweis: 'ermäßigt für Schüler*innen, Studis, Soli' },
]

export function beitragFuer(stufe: unknown): BeitragOption | undefined {
  return BEITRAEGE.find(b => b.stufe === stufe)
}
