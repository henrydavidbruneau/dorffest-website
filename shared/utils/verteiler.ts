/** Anrede in Rundmails an den Verteiler Zivilgesellschaft (erster Absatz der Mail, in Handschrift) */
export function verteilerAnrede(k: { organisation: string, ansprechperson?: string | null }) {
  const person = k.ansprechperson?.trim()
  return person ? `Hallo ${person},` : `Hallo liebe Leute von ${k.organisation.trim()},`
}
