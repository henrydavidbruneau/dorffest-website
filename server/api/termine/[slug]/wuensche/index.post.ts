// POST /api/termine/:slug/wuensche – Wunsch eintragen (sofort sichtbar, moderierbar), Push ans Vereinsheim.
// Rate-Limit → Honeypot → Validierung → Turnstile → Directus
export default defineEventHandler(async (event) => {
  rateLimit(event, 'wunsch', 8)
  const body = await leseBody(event)
  if (istBot(body)) return { ok: true, doppelt: false }

  const termin = await terminMitWunschliste(getRouterParam(event, 'slug') ?? '')
  if (termin.vergangen) throw fail(410, 'vergangen', 'Dieser Termin liegt schon zurück – Wünsche sind geschlossen.')

  const wunsch = { text: text(body.text, 120), name: text(body.name, 60) }
  if (wunsch.text.length < 2) throw fail(400, 'text', 'Was wünschst du dir?')

  await pruefeTurnstile(event, body)
  const ergebnis = await wunschEintragen(event, termin.id, wunsch)
  if (!ergebnis.doppelt) await wunschMelden(termin, wunsch)
  return { ok: true, doppelt: ergebnis.doppelt }
})
