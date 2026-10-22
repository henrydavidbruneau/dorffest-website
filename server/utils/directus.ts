// Directus-Zugriff mit dem statischen Server-Token (User `website-server`, Policy `Server`).
// Nur serverseitig – der Token kommt aus useRuntimeConfig() und geht nie ans Frontend.
// Rechte: DIRECTUS.md → „Rechte im Detail“. Auf `status = published` filtern wir trotzdem selbst.

type Abfrage = Record<string, string | number | boolean | undefined | null | object>

interface DirectusOptionen {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Abfrage
  body?: Record<string, unknown> | FormData
}

function konfiguration() {
  const { directusUrl, directusToken } = useRuntimeConfig()
  if (!directusUrl || !directusToken) {
    throw createError({ statusCode: 503, statusMessage: 'Directus ist nicht konfiguriert (NUXT_DIRECTUS_URL / NUXT_DIRECTUS_TOKEN).' })
  }
  return { url: directusUrl.replace(/\/+$/, ''), token: directusToken }
}

/** Objekte in der Query (filter, deep …) als JSON, wie Directus sie erwartet */
function queryFuerDirectus(query: Abfrage = {}) {
  return Object.fromEntries(Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v]))
}

export async function directusServer<T>(pfad: string, optionen: DirectusOptionen = {}): Promise<T> {
  const { url, token } = konfiguration()
  try {
    const antwort = await $fetch<{ data: T } | undefined>(`${url}${pfad}`, {
      method: optionen.method ?? 'GET',
      query: queryFuerDirectus(optionen.query),
      body: optionen.body,
      headers: { Authorization: `Bearer ${token}` },
    })
    // Anlegen ohne Leserecht (z.B. Anmeldungen) antwortet ohne Inhalt
    return antwort?.data as T
  }
  catch (e) {
    const err = e as { status?: number, data?: { errors?: { message: string }[] } }
    console.error(`[directus] ${optionen.method ?? 'GET'} ${pfad} → ${err.status}: ${err.data?.errors?.map(x => x.message).join('; ') ?? e}`)
    throw createError({ statusCode: 502, statusMessage: 'Das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.', data: { code: 'directus' } })
  }
}

/** Einträge einer Collection lesen */
export function directusListe<T>(collection: string, query: Abfrage = {}) {
  return directusServer<T[]>(`/items/${collection}`, { query: { limit: -1, ...query } })
}

/** Eintrag anlegen; liefert den neuen Datensatz (soweit der Server ihn lesen darf) */
export function directusAnlegen<T = unknown>(collection: string, daten: Record<string, unknown>) {
  return directusServer<T>(`/items/${collection}`, { method: 'POST', body: daten })
}

/** Datei hochladen (Felder vor der Datei, sonst ignoriert Directus sie).
 *  Den Ordner setzt die Policy `Server` selbst (Preset `gastbeitraege`). */
export async function directusDateiHochladen(datei: { daten: Uint8Array, typ: string, name: string }, felder: Record<string, string> = {}) {
  const form = new FormData()
  for (const [k, v] of Object.entries(felder)) form.append(k, v)
  form.append('file', new Blob([datei.daten as BlobPart], { type: datei.typ }), datei.name)
  return directusServer<{ id: string }>('/files', { method: 'POST', body: form })
}

export const VEROEFFENTLICHT = { status: { _eq: 'published' } }
