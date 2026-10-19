/** Angemeldete Person im Vereinsheim */
export interface VereinsheimIch {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  benutzername: string | null
  /** hat die Policy `Vorstand` (Mitglieder, Anträge, alle Auslagen) */
  vorstand: boolean
}
