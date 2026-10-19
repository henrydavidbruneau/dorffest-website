// Datenzugriff im Vereinsheim: alles über /api/vereinsheim/d/… mit dem Token der angemeldeten
// Person (httpOnly-Cookie). Directus prüft die Rechte; 401 → zur Tür (Login).
import type { VereinsheimIch } from '#shared/types/vereinsheim'

type Abfrage = Record<string, unknown>

function alsQuery(query: Abfrage = {}) {
  return Object.fromEntries(Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]))
}

async function anfrage<T>(pfad: string, optionen: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', query?: Abfrage, body?: unknown } = {}): Promise<T> {
  try {
    const antwort = await $fetch<{ data: T }>(`/api/vereinsheim/d/${pfad}`, {
      method: optionen.method ?? 'GET',
      query: alsQuery(optionen.query),
      body: optionen.body as Record<string, unknown> | FormData | undefined,
    })
    return antwort.data
  }
  catch (e) {
    if ((e as { statusCode?: number }).statusCode === 401) await navigateTo('/vereinsheim/tuer')
    throw e
  }
}

/** Fehlermeldung aus einer Server-Antwort */
export function vhFehlertext(e: unknown) {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err.data?.statusMessage || err.statusMessage || 'Das hat gerade nicht geklappt.'
}

const ordnerIds = new Map<string, string>()

export const vh = {
  liste: <T>(collection: string, query: Abfrage = {}) => anfrage<T[]>(`items/${collection}`, { query: { limit: -1, ...query } }),
  eins: <T>(collection: string, id: number | string, query: Abfrage = {}) => anfrage<T>(`items/${collection}/${id}`, { query }),
  anlegen: <T>(collection: string, daten: Abfrage) => anfrage<T>(`items/${collection}`, { method: 'POST', body: daten }),
  aendern: <T>(collection: string, id: number | string, daten: Abfrage) => anfrage<T>(`items/${collection}/${id}`, { method: 'PATCH', body: daten }),
  loeschen: (collection: string, id: number | string) => anfrage<null>(`items/${collection}/${id}`, { method: 'DELETE' }),
  /** Singletons (z.B. `verein`): lesen und ändern ohne ID */
  einzel: <T>(collection: string, query: Abfrage = {}) => anfrage<T>(`items/${collection}`, { query }),
  einzelAendern: <T>(collection: string, daten: Abfrage) => anfrage<T>(`items/${collection}`, { method: 'PATCH', body: daten }),
  /** Anzahl Einträge zu einem Filter */
  anzahl: async (collection: string, filter: Abfrage = {}) => {
    const [zeile] = await anfrage<{ count: { id: number | string } }[]>(`items/${collection}`, { query: { 'aggregate[count]': 'id', filter } })
    return Number(zeile?.count.id ?? 0)
  },
  users: <T>(query: Abfrage = {}) => anfrage<T[]>('users', { query }),
  async ordner(name: string) {
    if (!ordnerIds.has(name)) {
      const [o] = await anfrage<{ id: string }[]>('folders', { query: { filter: { name: { _eq: name }, parent: { _null: true } }, fields: 'id', limit: 1 } })
      if (o) ordnerIds.set(name, o.id)
    }
    return ordnerIds.get(name)
  },
  /** Datei in einen Ordner hochladen; liefert die Datei-ID */
  async hochladen(datei: Blob, dateiname: string, ordner: string) {
    const form = new FormData()
    const id = await vh.ordner(ordner)
    if (id) form.append('folder', id)
    form.append('file', datei, dateiname)
    return (await anfrage<{ id: string }>('files', { method: 'POST', body: form })).id
  },
  bild: (id: string, breite = 600) => `/api/vereinsheim/bild/${id}?width=${breite}`,
  datei: (id: string) => `/api/vereinsheim/bild/${id}?download=1`,
}

/** angemeldete Person (einmal geladen, für alle Seiten) */
export function useVereinsheimIch() {
  const ich = useState<VereinsheimIch | null>('vereinsheim-ich', () => null)
  async function laden() {
    ich.value = await $fetch<VereinsheimIch>('/api/vereinsheim/ich').catch(() => null)
    return ich.value
  }
  return { ich, laden }
}

/** kleine Rückmeldung unten im Bild („Ab ins Fach!“) */
export function useVereinsheimMeldung() {
  const meldung = useState<{ text: string, art: 'gut' | 'fehler', nr: number } | null>('vereinsheim-meldung', () => null)
  function zeige(text: string, art: 'gut' | 'fehler' = 'gut') {
    const nr = Date.now()
    meldung.value = { text, art, nr }
    setTimeout(() => {
      if (meldung.value?.nr === nr) meldung.value = null
    }, art === 'fehler' ? 7000 : 3500)
  }
  return { meldung, zeige, fehler: (e: unknown) => zeige(vhFehlertext(e), 'fehler') }
}
