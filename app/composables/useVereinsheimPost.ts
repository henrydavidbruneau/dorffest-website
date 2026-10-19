// Kontakt-Postfach im Vereinsheim (nur Vorstand): Liste und geöffnete Mails bleiben im Browser
// gemerkt (Dashboard und Post-Seite teilen sie), damit beim Wiederkommen sofort etwas dasteht.
// Solange die Seite sichtbar ist, schaut sie jede Minute nach neuer Post.

export type PostOrdner = 'eingang' | 'gesendet'
export interface PostMailKopf { uid: number, von: string, vonAdresse: string, an: string, betreff: string, datum: string, gelesen: boolean, beantwortet: boolean }
export interface PostMail extends PostMailKopf { text: string, anhaenge: { name: string, groesse: number }[] }
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

  return { listen, laedt, fehler, aktualisieren, mail, vorladen, vergessen }
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
