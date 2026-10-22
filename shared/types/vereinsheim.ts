/** Angemeldete Person im Vereinsheim */
export interface VereinsheimIch {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  benutzername: string | null
  /** Profilbild (Datei-ID in Directus) */
  avatar: string | null
  /** Tour gemacht oder abgelehnt (null = wird noch vorgeschlagen) */
  tour_erledigt_am: string | null
  /** Popup „Vereinsheim aufs Handy“ gesehen (null = kommt nach der Tour) */
  app_hinweis_am: string | null
  /** hat die Policy `Vorstand` (Mitglieder, Anträge, alle Auslagen) */
  vorstand: boolean
}
