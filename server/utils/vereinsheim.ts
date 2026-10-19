// Session des Vereinsheims (Muster aus DPAT `adminSession.ts`).
//
// Mitglieder melden sich mit ihrem EIGENEN Directus-Account an (Benutzername oder E-Mail).
// Access- und Refresh-Token liegen nur in httpOnly-Cookies – im Browser-JS ist nichts davon
// erreichbar. Alles im Vereinsheim läuft mit dem persönlichen Token: Directus prüft die Rechte
// (Policies `Mitglied` / `Vorstand`) und trägt ein, wer etwas angelegt oder geändert hat.
import { isError, type H3Event } from 'h3'
import type { VereinsheimIch } from '#shared/types/vereinsheim'

const AT = 'vh_at' // Access-Token, kurzlebig (~15 min)
const RT = 'vh_rt' // Refresh-Token, holt neue Access-Tokens
const RT_MAX_AGE = 60 * 60 * 24 * 7 // Directus-Standard für Refresh-Tokens

interface DirectusAuth {
  access_token: string
  expires: number // Millisekunden bis zum Ablauf
  refresh_token: string
}

export interface PersonAnfrage {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: unknown
  headers?: Record<string, string>
}

const nichtAngemeldet = () => createError({ statusCode: 401, statusMessage: 'Bitte melde dich an.', data: { code: 'login' } })

// secure nur in Produktion – sonst kommt das Cookie über http://localhost nie an
const cookieBasis = () => ({ httpOnly: true, secure: !import.meta.dev, sameSite: 'lax' as const, path: '/' })

function directusBasis() {
  const { directusUrl } = useRuntimeConfig()
  if (!directusUrl) throw createError({ statusCode: 503, statusMessage: 'Directus ist nicht konfiguriert.' })
  return directusUrl.replace(/\/+$/, '')
}

function speichereTokens(event: H3Event, auth: DirectusAuth) {
  setCookie(event, AT, auth.access_token, { ...cookieBasis(), maxAge: Math.max(60, Math.floor(auth.expires / 1000)) })
  setCookie(event, RT, auth.refresh_token, { ...cookieBasis(), maxAge: RT_MAX_AGE })
}

export function loescheTokens(event: H3Event) {
  deleteCookie(event, AT, cookieBasis())
  deleteCookie(event, RT, cookieBasis())
}

/** Benutzername → E-Mail (Directus meldet nur per E-Mail an). Mit `@` = schon eine E-Mail. */
export async function loginEmail(eingabe: string): Promise<string | null> {
  if (eingabe.includes('@')) return eingabe.toLowerCase()
  if (!/^[a-z0-9._-]{3,30}$/.test(eingabe)) return null
  const [user] = await directusServer<{ email: string | null }[]>('/users', { query: { fields: 'email', filter: { benutzername: { _eq: eingabe } }, limit: 1 } })
    .catch(() => [])
  return user?.email ?? null
}

/** Anmelden; gibt den frischen Access-Token zurück (die Cookies stehen erst in der Antwort) */
export async function anmelden(event: H3Event, email: string, passwort: string): Promise<string> {
  const res = await $fetch<{ data: DirectusAuth }>(`${directusBasis()}/auth/login`, {
    method: 'POST',
    body: { email, password: passwort, mode: 'json' },
  })
  speichereTokens(event, res.data)
  return res.data.access_token
}

export async function abmelden(event: H3Event) {
  const refresh_token = getCookie(event, RT)
  if (refresh_token) {
    await $fetch(`${directusBasis()}/auth/logout`, { method: 'POST', body: { refresh_token, mode: 'json' } }).catch(() => {})
  }
  loescheTokens(event)
}

// Directus-Refresh-Tokens gelten nur einmal. Laufen zwei Anfragen gleichzeitig mit demselben
// alten Token, bekommt die zweite das Ergebnis der ersten (pro Function-Instanz, kurz gemerkt).
const letzteErneuerungen = new Map<string, { um: number, auth: Promise<DirectusAuth> }>()

function erneuereEinmal(refresh_token: string): Promise<DirectusAuth> {
  const jetzt = Date.now()
  for (const [k, v] of letzteErneuerungen) if (jetzt - v.um > 30_000) letzteErneuerungen.delete(k)
  const treffer = letzteErneuerungen.get(refresh_token)
  if (treffer) return treffer.auth
  const auth = $fetch<{ data: DirectusAuth }>(`${directusBasis()}/auth/refresh`, {
    method: 'POST',
    body: { refresh_token, mode: 'json' },
  }).then(r => r.data)
  letzteErneuerungen.set(refresh_token, { um: jetzt, auth })
  auth.catch(() => letzteErneuerungen.delete(refresh_token))
  return auth
}

async function erneuereTokens(event: H3Event): Promise<string> {
  const refresh_token = getCookie(event, RT)
  if (!refresh_token) throw nichtAngemeldet()
  try {
    const auth = await erneuereEinmal(refresh_token)
    speichereTokens(event, auth)
    return auth.access_token
  }
  catch {
    // Keine Cookies löschen: eine parallele Anfrage könnte gerade frische gesetzt haben
    throw nichtAngemeldet()
  }
}

const istAbgelaufen = (e: unknown) => (e as { status?: number, statusCode?: number })?.status === 401
  || (e as { statusCode?: number })?.statusCode === 401

/** `aufruf` mit dem Token der angemeldeten Person; bei abgelaufenem Token einmal erneuern */
export async function mitSession<T>(event: H3Event, aufruf: (token: string) => Promise<T>): Promise<T> {
  const token = getCookie(event, AT) || await erneuereTokens(event)
  try {
    return await aufruf(token)
  }
  catch (e) {
    if (!istAbgelaufen(e)) throw e
    return await aufruf(await erneuereTokens(event))
  }
}

/** Directus-Fehler für das Vereinsheim verständlich machen */
function alsFehler(e: unknown): never {
  const err = e as { status?: number, data?: { errors?: { message: string, extensions?: { code?: string } }[] } }
  const status = err.status ?? 502
  const meldung = err.data?.errors?.[0]?.message
  if (status === 401) throw nichtAngemeldet()
  if (status === 403) throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Rechte. Frag im Vorstand nach.', data: { code: 'rechte' } })
  if (status === 404) throw createError({ statusCode: 404, statusMessage: 'Nicht gefunden.', data: { code: 'nicht_gefunden' } })
  console.error('[vereinsheim] Directus:', status, meldung ?? e)
  // Meldungen aus Flows (z.B. max. 4 Kleinanzeigen) und Validierung weitergeben
  throw createError({ statusCode: status >= 400 && status < 500 ? status : 502, statusMessage: meldung ?? 'Das hat gerade nicht geklappt.', data: { code: 'directus' } })
}

/** Directus-Aufruf im Namen der angemeldeten Person; liefert `data` */
export async function directusPerson<T>(event: H3Event, pfad: string, anfrage: PersonAnfrage = {}): Promise<T> {
  const basis = directusBasis()
  const query = Object.fromEntries(Object.entries(anfrage.query ?? {})
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v]))
  try {
    const antwort = await mitSession(event, token => $fetch<{ data: T } | undefined>(`${basis}${pfad}`, {
      method: anfrage.method ?? 'GET',
      query,
      body: anfrage.body as BodyInit | Record<string, unknown> | undefined,
      headers: { ...anfrage.headers, Authorization: `Bearer ${token}` },
    }))
    return antwort?.data as T
  }
  catch (e) {
    if (isError(e)) throw e // eigener Fehler (z.B. nicht angemeldet), kein Directus-Fehler
    alsFehler(e)
  }
}

/** Wer ist angemeldet? Vorstand = darf `mitglieder` lesen (Policy `Vorstand`). */
export async function ich(event: H3Event): Promise<VereinsheimIch> {
  const [user, vorstand] = await Promise.all([
    directusPerson<Omit<VereinsheimIch, 'vorstand'>>(event, '/users/me', { query: { fields: 'id,first_name,last_name,email,benutzername' } }),
    istVorstand(event),
  ])
  return { ...user, vorstand }
}

/** Nur die Vorstands-Frage (eine Anfrage an Directus statt zwei) */
export function istVorstand(event: H3Event): Promise<boolean> {
  return directusPerson(event, '/items/mitglieder', { query: { limit: 0 } }).then(() => true, () => false)
}

/** Für die Middleware: am Anfang einer Vereinsheim-Anfrage einmal erneuern, wenn nur noch das Refresh-Cookie da ist */
export async function erneuereWennNoetig(event: H3Event) {
  if (getCookie(event, AT) || !getCookie(event, RT)) return
  await erneuereTokens(event).catch(() => {})
}
