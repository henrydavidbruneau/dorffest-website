// POST /api/gastbeitrag/:schluessel – Gastbeitrag einreichen (multipart, optional mit Foto).
// Foto in den Directus-Ordner `gastbeitraege` hochladen, Eintrag in `gastbeitraege` (Status
// `eingereicht`), Einladung auf `eingereicht` setzen (außer `mehrfach`), Hinweis an den Verein.
import { RESSORTS } from '#shared/utils/ressorts'
import type { Ressort } from '#shared/types/artikel'

const ascii = (b: Uint8Array, von: number, bis: number) => String.fromCharCode(...b.subarray(von, bis))
// Dateityp an den ersten Bytes prüfen, nicht nur an der Angabe des Browsers
const BILDTYPEN: Record<string, (b: Uint8Array) => boolean> = {
  'image/jpeg': b => b[0] === 0xFF && b[1] === 0xD8,
  'image/png': b => b[0] === 0x89 && ascii(b, 1, 4) === 'PNG',
  'image/webp': b => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
}
const BILD_MAX = 4 * 1024 * 1024 // Netlify-Funktionen nehmen max. 6 MB; der Browser verkleinert vorher

/** Mehrzeiliger Text: Zeilenumbrüche bleiben, mehr als eine Leerzeile wird zusammengezogen */
function langtext(wert: unknown, max: number): string {
  return typeof wert === 'string'
    ? wert.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)
    : ''
}

export default defineEventHandler(async (event) => {
  rateLimit(event, 'gastbeitrag', 5)
  const einladung = await ladeEinladung(getRouterParam(event, 'schluessel') ?? '')
  if (!einladung) throw fail(404, 'link', 'Diesen Link gibt es nicht (mehr).')
  if (!oeffentlicheEinladung(einladung).gueltig) throw fail(410, 'link', 'Über diesen Link wurde schon ein Beitrag eingereicht oder er ist abgelaufen.')

  const teile = await readMultipartFormData(event).catch(() => undefined)
  if (!teile) throw fail(400, 'format', 'Das Formular kam nicht richtig an. Bitte versuch es noch einmal.')
  const body: Record<string, string> = {}
  let foto: { typ: string, daten: Uint8Array } | null = null
  for (const teil of teile) {
    if (!teil.name) continue
    if (teil.name === 'foto' && teil.filename) foto = { typ: teil.type ?? '', daten: teil.data }
    else body[teil.name] = new TextDecoder().decode(teil.data)
  }
  if (istBot(body)) return { ok: true }

  const ressort = body.ressort && body.ressort in RESSORTS ? body.ressort as Ressort : null
  const beitrag = {
    einladung: einladung.id,
    titel: text(body.titel, 140),
    ressort,
    teaser: langtext(body.teaser, 400) || null,
    inhalt: langtext(body.inhalt, 15000),
    bildunterschrift: text(body.bildunterschrift, 200) || null,
    foto_von: text(body.foto_von, 80) || null,
    autor_in: text(body.autor_in, 80),
    email: email(body.email),
    rechte_bestaetigt: body.rechte === 'true',
  }

  if (!beitrag.titel) throw fail(400, 'titel', 'Bitte gib deinem Beitrag einen Titel.')
  if (!beitrag.ressort) throw fail(400, 'ressort', 'Bitte wähl eine Rubrik.')
  if (beitrag.inhalt.length < 200) throw fail(400, 'inhalt', 'Dein Text ist noch sehr kurz – ein paar Absätze dürfen es schon sein.')
  if (!beitrag.autor_in) throw fail(400, 'autor_in', 'Bitte gib an, mit welchem Namen der Beitrag erscheinen soll.')
  if (!beitrag.email) throw fail(400, 'email', 'Das sieht nicht nach einer E-Mail-Adresse aus.')
  if (!beitrag.rechte_bestaetigt) throw fail(400, 'rechte', 'Bitte bestätige, dass du Text und Foto veröffentlichen darfst.')
  if (foto) {
    const pruefe = BILDTYPEN[foto.typ]
    if (!pruefe || !pruefe(foto.daten)) throw fail(400, 'foto', 'Das Foto muss ein JPG, PNG oder WebP sein.')
    if (foto.daten.length > BILD_MAX) throw fail(413, 'foto', 'Das Foto ist zu groß (max. 4 MB). Schick es uns gern per Mail.')
  }

  await pruefeTurnstile(event, body)

  const endung = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[foto?.typ ?? ''] ?? 'jpg'
  const bild = foto
    ? (await directusDateiHochladen(
        { daten: foto.daten, typ: foto.typ, name: `gastbeitrag-${Date.now()}.${endung}` },
        { title: beitrag.titel },
      )).id
    : null
  await directusAnlegen('gastbeitraege', { ...beitrag, ressort: await ressortId(beitrag.ressort), bild })
  await markiereEingereicht(einladung)
  await mailAnVerein(
    `Neuer Gastbeitrag: „${beitrag.titel}“ von ${beitrag.autor_in}`,
    [
      `${beitrag.autor_in} <${beitrag.email}> hat über den Link für ${einladung.name} einen Beitrag eingereicht (Rubrik ${RESSORTS[beitrag.ressort]}${bild ? ', mit Foto' : ''}).`,
      beitrag.teaser ?? beitrag.inhalt.slice(0, 300) + ' …',
      'Lesen und annehmen/ablehnen im Vereinsheim bzw. in Directus unter „gastbeitraege“.',
    ].join('\n\n'),
    beitrag.email,
  )
  return { ok: true }
})
