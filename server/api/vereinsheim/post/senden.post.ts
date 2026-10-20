// POST /api/vereinsheim/post/senden – Mail aus dem Vereinsheim schicken (nur Vorstand)
// { an, cc?, betreff, text, antwortAuf? } – cc = Liste oder kommagetrennt (z.B. „Allen antworten“) – antwortAuf = UID im Eingang (für Verlauf + „beantwortet“)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-post', 30, 60 * 60 * 1000)
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Senden darf nur der Vorstand.')
  const body = await leseBody(event)
  const an = email(body.an)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.replace(/\r\n?/g, '\n').trim().slice(0, 50_000) : ''
  const antwortAuf = Number(body.antwortAuf) || undefined
  const ccRoh = (Array.isArray(body.cc) ? body.cc : typeof body.cc === 'string' ? body.cc.split(/[,;\s]+/) : []).filter(a => typeof a === 'string' && a.trim())
  const cc = ccRoh.map(email)
  if (!an) throw fail(400, 'an', 'Die Empfänger-Adresse sieht nicht richtig aus.')
  if (cc.some(a => !a)) throw fail(400, 'cc', 'Eine Adresse unter „Kopie an“ sieht nicht richtig aus.')
  if (cc.length > 20) throw fail(400, 'cc', 'Höchstens 20 Adressen unter „Kopie an“.')
  if (!betreff) throw fail(400, 'betreff', 'Bitte einen Betreff eingeben.')
  if (!inhalt) throw fail(400, 'text', 'Die Mail ist noch leer.')
  return { ok: true, ...(await sendePost({ an, cc, betreff, text: inhalt, antwortAuf })) }
})
