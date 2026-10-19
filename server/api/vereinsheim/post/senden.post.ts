// POST /api/vereinsheim/post/senden – Mail aus dem Vereinsheim schicken (nur Vorstand)
// { an, betreff, text, antwortAuf? } – antwortAuf = UID im Eingang (für Verlauf + „beantwortet“)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-post', 30, 60 * 60 * 1000)
  if (!(await ich(event)).vorstand) throw fail(403, 'rechte', 'Senden darf nur der Vorstand.')
  const body = await leseBody(event)
  const an = email(body.an)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.replace(/\r\n?/g, '\n').trim().slice(0, 50_000) : ''
  const antwortAuf = Number(body.antwortAuf) || undefined
  if (!an) throw fail(400, 'an', 'Die Empfänger-Adresse sieht nicht richtig aus.')
  if (!betreff) throw fail(400, 'betreff', 'Bitte einen Betreff eingeben.')
  if (!inhalt) throw fail(400, 'text', 'Die Mail ist noch leer.')
  return { ok: true, ...(await sendePost({ an, betreff, text: inhalt, antwortAuf })) }
})
