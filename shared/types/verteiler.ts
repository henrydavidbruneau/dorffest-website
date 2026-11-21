import type { DirectusEintrag } from './directus'

/** Directus-Collection `verteiler`: Verteiler Zivilgesellschaft (Vereine, Initiativen, Gruppen im Ort) */
export interface VerteilerKontakt extends Omit<DirectusEintrag, 'status'> {
  organisation: string
  /** freiwillig – sonst „Hallo liebe Leute von …“ */
  ansprechperson: string | null
  email: string
  /** aus = bekommt vorerst keine Rundmails */
  aktiv: boolean
  /** intern */
  notiz: string | null
}

/** Directus-Collection `verteiler_mails`: Protokoll der Rundmails an den Verteiler */
export interface VerteilerMail {
  id: number
  termin: number | null
  betreff: string
  text: string
  empfaenger_anzahl: number | null
  gesendet_am: string | null
}
