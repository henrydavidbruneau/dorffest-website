// /api/vereinsheim/d/<pfad> – Durchleitung zu Directus mit dem Token der angemeldeten Person.
// Die Rechte prüft Directus (Policies `Mitglied` / `Vorstand`); hier nur eine Positivliste,
// damit das Vereinsheim nichts anderes als seine Collections, Dateien und Ordner erreicht.
const COLLECTIONS = new Set([
  'termine', 'anmeldungen', 'beitraege', 'termin_rundmails', 'ressorts', 'ausgaben', 'artikel',
  'kleinanzeigen', 'leserbriefe', 'gastbeitrag_einladungen', 'gastbeitraege', 'stimmen', 'faq', 'ideen',
  'vorschlaege', 'plenum_erinnerungen', 'mitgliedsantraege', 'mitglieder', 'auslagen', 'auslagen_belege', 'verein', 'rundbriefe',
])

function erlaubt(teile: string[], methode: string): boolean {
  const [art, name, id, ...rest] = teile
  if (rest.length) return false
  const idOk = id === undefined || /^[\w-]{1,64}$/.test(id)
  if (art === 'items') return !!name && COLLECTIONS.has(name) && idOk
  if (art === 'files') return (methode === 'GET' || methode === 'POST' || (methode === 'PATCH' && !!name)) && (name === undefined || /^[\w-]{1,64}$/.test(name)) && id === undefined
  if (art === 'folders' || art === 'users') return methode === 'GET' && name === undefined
  return false
}

export default defineEventHandler(async (event) => {
  const methode = event.method
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(methode)) throw fail(405, 'methode', 'Nicht erlaubt')
  const teile = (getRouterParam(event, 'pfad') ?? '').split('/').filter(Boolean)
  if (!erlaubt(teile, methode)) throw fail(404, 'pfad', 'Nicht gefunden')

  const query = getQuery(event) as Record<string, string>
  let body: unknown
  let headers: Record<string, string> | undefined
  if (methode === 'POST' || methode === 'PATCH') {
    const typ = getRequestHeader(event, 'content-type') ?? ''
    if (typ.startsWith('multipart/form-data')) {
      // Datei-Upload unverändert weiterreichen (Netlify-Funktionen nehmen max. 6 MB)
      body = await readRawBody(event, false)
      headers = { 'content-type': typ }
    }
    else body = await readBody(event)
  }
  return { data: await directusPerson(event, `/${teile.join('/')}`, { method: methode as 'GET', query, body, headers }) }
})
