// Wunschliste bei Terminen (z.B. „Welche Lieder sollen wir singen?“): Directus `wuensche` + `wunsch_stimmen`.
// Ohne Anmeldung: Wünsche sind sofort sichtbar (Moderation im Vereinsheim), jede*r hat je Wunsch eine Stimme.
// „Jede*r“ = ein Browser: beim ersten Abstimmen bekommt er ein zufälliges Cookie, in Directus steht nur dessen Hash.
import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE = 'wunsch_kennung'

/** Hash der Browser-Kennung; `anlegen` setzt das Cookie, falls es noch keins gibt */
export function waehlerVon(event: H3Event, anlegen = false): string | null {
  let kennung = getCookie(event, COOKIE)
  if (!kennung || !/^[a-f0-9]{32}$/.test(kennung)) {
    if (!anlegen) return null
    kennung = randomBytes(16).toString('hex')
    setCookie(event, COOKIE, kennung, { httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 400 })
  }
  return createHash('sha256').update(`wunsch:${kennung}`).digest('hex')
}

/** Termin mit aktiver Wunschliste (sonst 404) */
export async function terminMitWunschliste(slug: string) {
  const termin = await ladeTerminDetail(slug)
  if (!termin?.wunschliste_aktiv) throw fail(404, 'keine_wunschliste', 'Für diesen Termin gibt es keine Wunschliste.')
  return termin
}

async function ladeWuensche(terminId: number) {
  return directusListe<Wunsch>('wuensche', { fields: 'id,text,name,date_created', filter: { _and: [VEROEFFENTLICHT, { termin: { _eq: terminId } }] }, limit: 500 })
}

/** Wünsche eines Termins, meiste Stimmen zuerst (bei Gleichstand der ältere) */
export async function wunschliste(event: H3Event, terminId: number, waehler = waehlerVon(event)): Promise<WunschMitStimmen[]> {
  const wuensche = await ladeWuensche(terminId)
  if (!wuensche.length) return []
  const ids = wuensche.map(w => w.id)
  const [zaehlung, meine] = await Promise.all([
    directusServer<{ wunsch: number, count: { id: number | string } }[]>('/items/wunsch_stimmen', {
      query: { 'aggregate[count]': 'id', 'groupBy[]': 'wunsch', 'filter': { wunsch: { _in: ids } }, 'limit': -1 },
    }),
    waehler
      ? directusListe<{ wunsch: number }>('wunsch_stimmen', { fields: 'wunsch', filter: { _and: [{ waehler: { _eq: waehler } }, { wunsch: { _in: ids } }] } })
      : Promise.resolve([]),
  ])
  const stimmen = new Map(zaehlung.map(z => [Number(z.wunsch), Number(z.count?.id) || 0]))
  const meineIds = new Set(meine.map(m => Number(m.wunsch)))
  return wuensche
    .map(w => ({ id: w.id, text: w.text, name: w.name, stimmen: stimmen.get(w.id) ?? 0, meine: meineIds.has(w.id), datum: w.date_created }))
    .sort((a, b) => b.stimmen - a.stimmen || Date.parse(a.datum) - Date.parse(b.datum))
    .map(({ datum: _datum, ...w }) => w)
}

/** Stimme setzen (an) oder zurücknehmen (aus) */
export async function stimmeSetzen(waehler: string, wunschId: number, an: boolean) {
  const vorhanden = await directusListe<{ id: number }>('wunsch_stimmen', { fields: 'id', filter: { _and: [{ waehler: { _eq: waehler } }, { wunsch: { _eq: wunschId } }] } })
  if (an && !vorhanden.length) await directusAnlegen('wunsch_stimmen', { wunsch: wunschId, waehler })
  if (!an) for (const v of vorhanden) await directusServer(`/items/wunsch_stimmen/${v.id}`, { method: 'DELETE' })
}

/** gleich geschrieben? (Groß/klein, Leer- und Satzzeichen egal) */
const vergleichbar = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

/** Wunsch eintragen; gibt es ihn schon, zählt stattdessen eine Stimme dafür */
export async function wunschEintragen(event: H3Event, terminId: number, wunsch: { text: string, name: string }) {
  const waehler = waehlerVon(event, true)!
  const doppelt = (await ladeWuensche(terminId)).find(w => vergleichbar(w.text) === vergleichbar(wunsch.text))
  if (doppelt) {
    await stimmeSetzen(waehler, doppelt.id, true)
    return { id: doppelt.id, doppelt: true }
  }
  const neu = await directusAnlegen<{ id: number }>('wuensche', { termin: terminId, text: wunsch.text, name: wunsch.name || null })
  // Wer etwas wünscht, ist auch dafür
  if (neu?.id) await stimmeSetzen(waehler, neu.id, true)
  return { id: neu?.id ?? null, doppelt: false }
}

/** Push an alle Geräte im Vereinsheim, die Benachrichtigungen eingeschaltet haben */
export async function wunschMelden(termin: { id: number, titel: string }, wunsch: { text: string, name: string }) {
  try {
    const abos = await directusListe<PushAbo>('push_abos', { fields: 'id,endpoint,p256dh,auth', filter: { user_created: { _nnull: true } } })
    if (!abos.length) return
    await sendePush(abos, {
      titel: `Neuer Wunsch: ${wunsch.text}`,
      text: `${termin.titel}${wunsch.name ? ` · von ${wunsch.name}` : ''}`,
      url: `/vereinsheim/termine/${termin.id}/wuensche`,
    })
  }
  catch (e) {
    console.error('[wuensche] Push nicht geschickt:', (e as Error)?.message ?? e)
  }
}
