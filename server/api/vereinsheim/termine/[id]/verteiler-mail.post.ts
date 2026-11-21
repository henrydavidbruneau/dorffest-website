// POST /api/vereinsheim/termine/:id/verteiler-mail – Rundmail an den Verteiler Zivilgesellschaft
// (Vereine, Initiativen, Gruppen; Diverses → Verteiler). Schlichte Textmail (kein Website-Look), gemeinsame
// Anrede steht im Text; trotzdem einzeln je Adresse verschickt, damit niemand die anderen sieht.
// Läuft mit dem Token der Person (Recht: verteiler lesen), Protokoll in `verteiler_mails`.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-verteiler-mail', 10)
  const id = Number(getRouterParam(event, 'id'))
  const body = await leseBody(event)
  const betreff = text(body.betreff, 200)
  const inhalt = typeof body.text === 'string' ? body.text.trim().slice(0, 10000) : ''
  if (!betreff || inhalt.length < 10) throw fail(400, 'leer', 'Bitte Betreff und Text eingeben.')

  const termin = await directusPerson<{ titel: string } | null>(event, `/items/termine/${id}`, { query: { fields: 'titel' } })
  if (!termin) throw fail(404, 'termin', 'Termin nicht gefunden')

  const kontakte = await directusPerson<VerteilerKontakt[]>(event, '/items/verteiler', {
    query: { fields: 'organisation,ansprechperson,email', filter: { aktiv: { _eq: true } }, limit: -1 },
  })
  // jede Adresse nur einmal
  const empfaenger = [...new Map(kontakte.filter(k => k.email).map(k => [k.email.trim().toLowerCase(), k])).values()]
  if (!empfaenger.length) throw fail(400, 'leer', 'Im Verteiler steht noch niemand (Diverses → Verteiler).')

  let gesendet = 0
  for (const k of empfaenger) {
    await sendeMail({
      an: k.email.trim(),
      betreff,
      tags: ['verteiler'],
      nurText: true,
      text: [inhalt, GRUSS].join('\n\n'),
    }).then(() => gesendet++, e => console.error('[verteiler-mail]', k.email, e?.data ?? e))
  }
  await directusPerson(event, '/items/verteiler_mails', {
    method: 'POST',
    body: { termin: id, betreff, text: inhalt, empfaenger_anzahl: gesendet, gesendet_am: new Date().toISOString() },
  })
  return { ok: true, gesendet, empfaenger: empfaenger.length }
})
