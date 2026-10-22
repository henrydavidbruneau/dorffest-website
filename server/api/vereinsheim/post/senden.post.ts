// POST /api/vereinsheim/post/senden – Mail aus dem Vereinsheim schicken (nur Vorstand)
// { an, cc?, betreff, text, antwortAuf? } – an/cc = Liste oder kommagetrennt (z.B. „Allen antworten“) – antwortAuf = UID im Eingang (für Verlauf + „beantwortet“)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-post', 30, 60 * 60 * 1000)
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Senden darf nur der Vorstand.')
  const body = await leseBody(event)
  // Adressliste aus Array oder „a@b.de, c@d.de“; leere Einträge weg, ungültige werden zu ''
  const liste = (wert: unknown) => (Array.isArray(wert) ? wert : typeof wert === 'string' ? wert.split(/[,;\s]+/) : [])
    .filter(a => typeof a === 'string' && a.trim())
    .map(email)
  const an = liste(body.an)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.replace(/\r\n?/g, '\n').trim().slice(0, 50_000) : ''
  const antwortAuf = Number(body.antwortAuf) || undefined
  const cc = liste(body.cc)
  if (!an.length) throw fail(400, 'an', 'Bitte mindestens eine Empfänger-Adresse eingeben.')
  if (an.some(a => !a)) throw fail(400, 'an', 'Eine Adresse unter „An“ sieht nicht richtig aus.')
  if (an.length > 20) throw fail(400, 'an', 'Höchstens 20 Adressen unter „An“.')
  if (cc.some(a => !a)) throw fail(400, 'cc', 'Eine Adresse unter „Kopie an“ sieht nicht richtig aus.')
  if (cc.length > 20) throw fail(400, 'cc', 'Höchstens 20 Adressen unter „Kopie an“.')
  if (!betreff) throw fail(400, 'betreff', 'Bitte einen Betreff eingeben.')
  if (!inhalt) throw fail(400, 'text', 'Die Mail ist noch leer.')
  return { ok: true, ...(await sendePost({ an, cc, betreff, text: inhalt, antwortAuf })) }
})
