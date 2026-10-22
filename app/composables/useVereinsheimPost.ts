// Kontakt-Postfach im Vereinsheim (nur Vorstand): Liste und geöffnete Mails bleiben im Browser
// gemerkt (Dashboard und Post-Seite teilen sie), damit beim Wiederkommen sofort etwas dasteht.
// Das Postfach schaut alle 3 Minuten nach neuer Post, solange es sichtbar ist; das Dashboard nur beim Öffnen.

export type PostOrdner = 'eingang' | 'gesendet'
export interface PostMailKopf { uid: number, messageId: string | null, von: string, vonAdresse: string, an: string, cc: string, betreff: string, datum: string, gelesen: boolean, beantwortet: boolean }
export interface PostMail extends PostMailKopf { text: string, anhaenge: { name: string, groesse: number }[], anAdressen: string[], ccAdressen: string[], weitereAn: string[], weitereCc: string[] }
interface Stand { eingerichtet: boolean, webmail: string, mails: PostMailKopf[], um: number }

const ALLE_MINUTE = 60_000
// Mails, die gerade geholt werden (für alle Seiten gemeinsam)
const unterwegs = new Map<string, Promise<PostMail>>()

export function useVereinsheimPost() {
  const listen = useState<Partial<Record<PostOrdner, Stand>>>('vh-post-listen', () => ({}))
  const laedt = useState<Partial<Record<PostOrdner, boolean>>>('vh-post-laedt', () => ({}))
  const fehler = useState<string | null>('vh-post-fehler', () => null)
  // geöffnete Mails (Schlüssel „ordner:uid“) – nicht reaktiv nötig, nur ein Zwischenspeicher
  const mails = useState<Record<string, PostMail>>('vh-post-mails', () => ({}))

  async function aktualisieren(ordner: PostOrdner = 'eingang', frisch = false) {
    if (laedt.value[ordner]) return
    laedt.value = { ...laedt.value, [ordner]: true }
    try {
      const r = await $fetch<Omit<Stand, 'um'>>('/api/vereinsheim/post', { query: { ordner, ...(frisch ? { frisch: 1 } : {}) } })
      listen.value = { ...listen.value, [ordner]: { ...r, um: Date.now() } }
      fehler.value = null
    }
    catch (e) {
      fehler.value = vhFehlertext(e)
    }
    finally {
      laedt.value = { ...laedt.value, [ordner]: false }
    }
  }

  /** Mail laden – aus dem Speicher, sonst vom Server (gleichzeitige Anfragen teilen sich eine) */
  function mail(ordner: PostOrdner, uid: number): Promise<PostMail> {
    const schluessel = `${ordner}:${uid}`
    if (mails.value[schluessel]) return Promise.resolve(mails.value[schluessel])
    if (!unterwegs.has(schluessel)) {
      unterwegs.set(schluessel, $fetch<PostMail>(`/api/vereinsheim/post/${uid}`, { query: { ordner } })
        .then((m) => {
          mails.value[schluessel] = m
          return m
        })
        .finally(() => unterwegs.delete(schluessel)))
    }
    return unterwegs.get(schluessel)!
  }

  /** beim Drüberfahren schon mal holen; Fehler hier sind egal */
  function vorladen(ordner: PostOrdner, uid: number) {
    mail(ordner, uid).catch(() => {})
  }

  function vergessen() {
    mails.value = {}
  }

  /** Mail in den Papierkorb; verschwindet sofort aus der Liste */
  async function loeschen(ordner: PostOrdner, uid: number) {
    const r = await $fetch<{ papierkorb: boolean }>(`/api/vereinsheim/post/${uid}`, { method: 'DELETE', query: { ordner } })
    const stand = listen.value[ordner]
    if (stand) listen.value = { ...listen.value, [ordner]: { ...stand, mails: stand.mails.filter(m => m.uid !== uid) } }
    mails.value = Object.fromEntries(Object.entries(mails.value).filter(([k]) => k !== `${ordner}:${uid}`))
    return r
  }

  /** als (un)gelesen markieren; die Liste zeigt es sofort */
  async function gelesen(ordner: PostOrdner, uid: number, wert: boolean) {
    await $fetch(`/api/vereinsheim/post/${uid}`, { method: 'PATCH', query: { ordner }, body: { gelesen: wert } })
    const stand = listen.value[ordner]
    if (stand) listen.value = { ...listen.value, [ordner]: { ...stand, mails: stand.mails.map(m => (m.uid === uid ? { ...m, gelesen: wert } : m)) } }
  }

  return { listen, laedt, fehler, aktualisieren, mail, vorladen, vergessen, loeschen, gelesen }
}

/** `arbeit` jede Minute ausführen, solange die Seite sichtbar ist – und sofort, wenn man zurückkommt */
export function useAutoAktualisierung(arbeit: () => unknown, abstand = ALLE_MINUTE) {
  let uhr: ReturnType<typeof setInterval> | null = null
  let zuletzt = Date.now()
  const lauf = () => {
    zuletzt = Date.now()
    arbeit()
  }
  function sichtbarkeit() {
    if (document.visibilityState === 'visible' && Date.now() - zuletzt > abstand / 2) lauf()
  }
  onMounted(() => {
    uhr = setInterval(() => document.visibilityState === 'visible' && lauf(), abstand)
    document.addEventListener('visibilitychange', sichtbarkeit)
  })
  onBeforeUnmount(() => {
    if (uhr) clearInterval(uhr)
    document.removeEventListener('visibilitychange', sichtbarkeit)
  })
}

// ---------- Markierungen: Mail für eine Person markieren (Directus `post_markierungen`) ----------
export interface PostPerson { id: string, first_name: string | null, last_name: string | null }
export interface PostMarkierung {
  id: number
  message_id: string
  ordner: PostOrdner
  uid: number | null
  betreff: string | null
  von: string | null
  datum: string | null
  notiz: string | null
  erledigt: boolean
  date_created: string
  fuer: PostPerson | null
  user_created: PostPerson | null
}

const MARKIERUNG_FELDER = 'id,message_id,ordner,uid,betreff,von,datum,notiz,erledigt,date_created,fuer.id,fuer.first_name,fuer.last_name,user_created.id,user_created.first_name,user_created.last_name'

export const personName = (p: PostPerson | null | undefined) => (p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || 'jemand' : 'jemand')

export function usePostMarkierungen() {
  // offene (nicht erledigte) Markierungen aller Personen
  const markierungen = useState<PostMarkierung[] | null>('vh-post-markierungen', () => null)
  const personen = useState<PostPerson[] | null>('vh-post-personen', () => null)

  async function laden() {
    markierungen.value = await vh.liste<PostMarkierung>('post_markierungen', {
      fields: MARKIERUNG_FELDER, filter: { erledigt: { _eq: false } }, sort: '-date_created', limit: 300,
    })
  }

  /** Wer kann markiert werden? Alle mit Rolle Vorstand (nur sie sehen das Postfach) */
  async function personenLaden() {
    if (personen.value) return
    const basis = { fields: 'id,first_name,last_name', sort: 'first_name', limit: -1 }
    personen.value = await vh.users<PostPerson>({ ...basis, filter: { status: { _eq: 'active' }, role: { name: { _in: ['Vorstand', 'Administrator'] } } } })
      // ältere Rechte (directus-setup.mjs noch nicht gelaufen): alle aktiven Konten
      .catch(() => vh.users<PostPerson>({ ...basis, filter: { status: { _eq: 'active' } } }))
  }

  function zurMail(messageId: string | null | undefined) {
    return messageId ? (markierungen.value ?? []).filter(m => m.message_id === messageId) : []
  }

  async function markieren(mail: PostMail, ordner: PostOrdner, fuer: string, notiz: string) {
    if (!mail.messageId) throw new Error('Diese Mail hat keine Message-ID und lässt sich nicht markieren.')
    await vh.anlegen('post_markierungen', {
      message_id: mail.messageId, ordner, uid: mail.uid, betreff: mail.betreff.slice(0, 255), von: mail.von.slice(0, 255),
      datum: mail.datum, fuer, notiz: notiz.trim().slice(0, 300) || null,
    })
    await laden()
  }

  async function erledigen(id: number) {
    await vh.aendern('post_markierungen', id, { erledigt: true })
    markierungen.value = (markierungen.value ?? []).filter(m => m.id !== id)
  }

  return { markierungen, personen, laden, personenLaden, zurMail, markieren, erledigen }
}
