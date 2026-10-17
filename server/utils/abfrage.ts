// Kleine Helfer zum Lesen von Query-Parametern
export function zahlAusQuery(wert: unknown, max = 100): number | undefined {
  const zahl = Number(wert)
  return Number.isInteger(zahl) && zahl > 0 ? Math.min(zahl, max) : undefined
}

export function jaAusQuery(wert: unknown): boolean | undefined {
  return wert === 'true' || wert === '1' ? true : undefined
}
