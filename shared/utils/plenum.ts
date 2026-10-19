// Plenum-Erinnerungen: Wer sich auf /mitmachen einträgt, steht beim Plenum-Termin (Adresse „plenum…“)
// mit in der Anmeldeliste und bekommt die Erinnerung automatisch ein paar Tage vorher.
export const ERINNERUNG_TAGE_VORHER = 3

export const istPlenum = (slug: string | null | undefined) => !!slug?.startsWith('plenum')
