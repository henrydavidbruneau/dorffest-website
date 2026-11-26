// GET /api/vereinsheim/post/:uid/anhang/:nr?ordner=eingang|gesendet[&laden=1] – Anhang einer Mail (nur Vorstand)
// Bilder (auch die im Mailtext) und PDFs öffnen im Browser, alles andere wird heruntergeladen.
// Fremde Inhalte auf unserer Adresse: nie als HTML/SVG ausführen (nosniff + CSP sandbox).
const ANSEHEN = /^(image\/(png|jpe?g|gif|webp|avif|bmp)|application\/pdf)$/i

export default defineEventHandler(async (event) => {
  if (!(await istVorstand(event))) throw fail(403, 'rechte', 'Das Postfach sieht nur der Vorstand.')
  const uid = Number(getRouterParam(event, 'uid'))
  const nr = Number(getRouterParam(event, 'nr'))
  if (!Number.isInteger(uid) || uid < 1 || !Number.isInteger(nr) || nr < 0) throw fail(404, 'anhang', 'Nicht gefunden')
  const query = getQuery(event)
  const anhang = await ladeAnhang(query.ordner === 'gesendet' ? 'gesendet' : 'eingang', uid, nr)
  if (anhang.inhalt.length > ANHANG_GRENZE) throw fail(413, 'anhang', 'Dieser Anhang ist zu groß – bitte im Webmail öffnen.')

  const ansehen = ANSEHEN.test(anhang.typ) && !query.laden
  const name = anhang.name.replace(/[\r\n"\\]/g, '_')
  const ascii = name.replace(/[^\x20-\x7E]/g, '_')
  setHeader(event, 'Content-Type', ansehen ? anhang.typ : 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `${ansehen ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`)
  setHeader(event, 'Content-Length', anhang.inhalt.length)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (!/pdf/i.test(anhang.typ)) setHeader(event, 'Content-Security-Policy', 'sandbox; default-src \'none\'; img-src \'self\'; style-src \'unsafe-inline\'')
  // Mails ändern sich nicht: im Browser kurz merken, aber nirgends sonst
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  return new Uint8Array(anhang.inhalt)
})
