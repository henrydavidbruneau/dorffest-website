// Mails im Look der Website: lila Rahmen, Creme-Karte, Logo zentriert darunter,
// Kopfzeile wie im Dorfanzeiger, Begrüßung in Handschrift, große Überschrift mit Hervorhebung,
// Gruß unter gestrichelter Linie. Geschrieben wird Klartext (Leerzeile = Absatz) mit wenigen Zeichen:
//   Hallo Marta,               erster Absatz = Begrüßung (Handschrift)
//   # Du bist ==dabei!==       Überschrift, ==…== = Flieder-Hervorhebung (geht auch im Text)
//   ## Zwischenüberschrift
//   **fett** · *kursiv* · [Linktext](https://…)
//   [Knopftext](https://…)     allein im Absatz = lila Knopf
//   [A](…) · [B](…) · [C](…)   allein im Absatz = Reihe kleiner Knöpfe (z.B. Google · Outlook · .ics)
//   ![Beschreibung](/bilder/… "Bildunterschrift")   allein im Absatz = Bild
//   - Punkt                    Aufzählung
//   ---                        gestrichelte Trennlinie
// Läuft auf dem Server (Versand) und im Vereinsheim (Vorschau) – nur Inline-Styles und Tabellen.
// Schriften kommen von der eigenen Seite (/mail/*.woff2): Apple Mail & Co. zeigen sie,
// Gmail/Outlook nehmen die Ersatzschrift.

const LILA = '#7A2A7E'
const CREME = '#FFFDF7'
const PFIRSICH = '#FCE0C5'
const ORANGE = '#E8820C'
const ORANGE_TEXT = '#A45C08'
const FLIEDER = '#8E6FE0'
const SCHRIFT = '\'Poppins\', \'Helvetica Neue\', Arial, sans-serif'
const DISPLAY = '\'Londrina Solid\', Impact, \'Arial Black\', sans-serif'
const HAND = '\'Reenie Beanie\', \'Bradley Hand\', \'Comic Sans MS\', cursive'
const TITEL = `font-family:${DISPLAY};font-weight:900;text-transform:uppercase;color:${LILA}`

const LINK = /\[([^\]\n]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g
const KNOPF = /^\[([^\]\n]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/
const BILD = /^!\[([^\]\n]*)\]\(((?:https?:\/\/|\/)[^\s)]+)(?:\s+"([^"\n]*)")?\)$/
const ANREDE = /^(hallo|hi|hey|moin|liebe|lieber|liebes)\b[^\n]{0,60}$/i

function esc(text: string) {
  return text.replace(/[&<>"']/g, z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[z]!)
}

/** Klartext-Fassung für Mailprogramme ohne HTML */
export function mailText(text: string) {
  return text
    .replace(/^!\[([^\]\n]*)\]\([^)]*\)$/gm, (_, alt: string) => (alt ? `[Bild: ${alt}]` : ''))
    .replace(LINK, '$1: $2')
    .replace(/^#{1,2}\s+/gm, '')
    .replace(/^---$/gm, '— — —')
    .replace(/==([^=\n]+)==/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
}

/** Flieder-Kasten hinter Wörtern wie auf der Website (<BasisHervorhebung>); Drehung nur, wo das Mailprogramm sie kann */
function hervorhebung(html: string) {
  return `<span style="display:inline-block;padding:0.1em 0.22em 0.04em;border-radius:4px 4px 14px 4px;background:${FLIEDER};color:#FFFFFF;transform:rotate(-1.5deg)">${html}</span>`
}

function absolut(url: string, basis: string) {
  return url.startsWith('/') ? `${basis}${url}` : url
}

/** Text einer Zeile: Links, fett, kursiv, Hervorhebung – alles andere escaped */
function zeile(absatz: string, basis: string) {
  const teile: string[] = []
  const merke = (html: string) => `${teile.push(html) - 1}`
  let t = absatz
    .replace(LINK, (_, text: string, url: string) => merke(`<a href="${esc(absolut(url, basis))}" style="color:${LILA};font-weight:700">${esc(text)}</a>`))
    .replace(/https?:\/\/[^\s<]+/g, url => merke(`<a href="${esc(url)}" style="color:${LILA};word-break:break-all">${esc(url)}</a>`))
  t = esc(t)
    .replace(/==([^=\n]+)==/g, (_, w: string) => hervorhebung(w))
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>')
  return t.replace(/(\d+)/g, (_, i: string) => teile[Number(i)]!)
}

function knopf(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 24px"><tr><td style="border-radius:8px;background:${LILA}">`
    + `<a href="${esc(url)}" style="display:inline-block;padding:13px 26px;font-family:${DISPLAY};font-size:18px;font-weight:900;letter-spacing:0.02em;text-transform:uppercase;color:${CREME};text-decoration:none;border-radius:8px">${esc(text)}</a>`
    + '</td></tr></table>'
}

/** Reihe kleiner Knöpfe mit Rahmen (z.B. „Zum Kalender hinzufügen“: Google · Outlook · Apple) */
function knopfReihe(knoepfe: [string, string][]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr>${knoepfe.map(([text, url]) =>
    `<td style="padding:0 8px 8px 0"><a href="${esc(url)}" style="display:inline-block;padding:8px 14px;border:2px solid ${LILA};border-radius:8px;font-family:${DISPLAY};font-size:15px;font-weight:900;text-transform:uppercase;color:${LILA};text-decoration:none">${esc(text)}</a></td>`).join('')}</tr></table>`
}

function absatzHtml(roh: string, basis: string, erster: boolean): string {
  const a = roh.trim()
  if (erster && ANREDE.test(a)) {
    // „Hallo Marta,“ → „Hallo Marta!“ in Handschrift, wie über den Überschriften der Website
    return `<p style="margin:0;font-family:${HAND};font-size:36px;line-height:1.1;color:${ORANGE_TEXT}">${esc(a.replace(/[,:]$/, '!'))}</p>`
  }
  if (a.startsWith('## ')) return `<h2 style="margin:30px 0 12px;font-size:30px;line-height:1.15;${TITEL}">${zeile(a.slice(3), basis)}</h2>`
  if (a.startsWith('# ')) return `<h1 style="margin:6px 0 24px;font-size:54px;line-height:1.02;${TITEL}">${zeile(a.slice(2), basis)}</h1>`
  if (a === '---') return `<div style="margin:28px 0;border-top:2px dashed ${ORANGE};line-height:0;font-size:0">&nbsp;</div>`
  const bild = a.match(BILD)
  if (bild) {
    const [, alt, url, unterschrift] = bild
    return `<div style="margin:6px 0 24px"><img src="${esc(absolut(url!, basis))}" alt="${esc(alt ?? '')}" width="556" style="display:block;width:100%;max-width:556px;height:auto;border:0;border-radius:10px">`
      + (unterschrift ? `<p style="margin:8px 0 0;font-family:${HAND};font-size:22px;line-height:1.1;color:#5c564d">${esc(unterschrift)}</p>` : '')
      + '</div>'
  }
  const k = a.match(KNOPF)
  if (k) return knopf(k[1]!, absolut(k[2]!, basis))
  const reihe = a.split(/\s+·\s+/).map(teil => teil.match(KNOPF))
  if (reihe.length > 1 && reihe.every(Boolean)) return knopfReihe(reihe.map(m => [m![1]!, absolut(m![2]!, basis)]))
  if (/^https?:\/\/\S+$/.test(a)) return knopf('Link öffnen', a)
  const zeilen = a.split('\n')
  if (zeilen.every(z => /^[-•]\s+/.test(z))) {
    return `<ul style="margin:0 0 18px;padding-left:22px">${zeilen.map(z => `<li style="margin:0 0 6px">${zeile(z.replace(/^[-•]\s+/, ''), basis)}</li>`).join('')}</ul>`
  }
  return `<p style="margin:0 0 18px">${zeile(a, basis)}</p>`
}

export interface MailHtmlOptionen {
  /** Adresse der Website (Logo, Schriften, Bilder, Links im Fuß) */
  basis: string
  /** rechts in der Kopfzeile, z.B. „Rundbrief“; ohne Rubrik keine Kopfzeile */
  rubrik?: string
  /** Abmelde-Link im Fuß (Newsletter: Brevo-Platzhalter `{{ unsubscribe }}`) */
  abmelden?: string
  /** großes „Bis bald im Dorf!“ als Abschluss (Rundbrief); sonst nur die Kontaktdaten unter der Linie */
  grosserGruss?: boolean
  /** kurzer Vorschautext im Postfach (nicht sichtbar) */
  vorschau?: string
}

/** „Bis bald im Dorf!“ → letztes Wort hervorgehoben, wie im Fuß der Website */
function grussTitel(z: string) {
  const i = z.lastIndexOf(' ')
  return i > 0 ? `${esc(z.slice(0, i))} ${hervorhebung(esc(z.slice(i + 1)))}` : esc(z)
}

function schriften(basis: string) {
  const f = (familie: string, datei: string, gewicht: number) =>
    `@font-face{font-family:'${familie}';font-style:normal;font-weight:${gewicht};src:url('${basis}/mail/${datei}.woff2') format('woff2')}`
  return f('Londrina Solid', 'londrina-solid-900', 900) + f('Poppins', 'poppins-300', 300) + f('Poppins', 'poppins-700', 700) + f('Reenie Beanie', 'reenie-beanie-400', 400)
}

export function mailHtml(text: string, { basis, rubrik, abmelden, grosserGruss, vorschau }: MailHtmlOptionen): string {
  const absaetze = text.replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/)
  // der Gruß am Ende bekommt die gestrichelte Linie wie auf der Website
  const grussDa = absaetze.at(-1)?.trim() === GRUSS
  const inhalt = (grussDa ? absaetze.slice(0, -1) : absaetze).map((a, i) => absatzHtml(a, basis, i === 0)).join('\n')
  // Gruß schlicht: nur „Bis bald im Dorf!“ (Verein + Kontakt stehen in der Klartext-Fassung und im Absender)
  // Abschluss unter der gestrichelten Linie: beim Rundbrief groß „Bis bald im Dorf!“, sonst schlicht die Kontaktdaten
  const [gruss1, ...kontakt] = GRUSS.split('\n')
  const gruss = !grussDa
    ? ''
    : grosserGruss
      ? `<div style="margin-top:30px;padding-top:22px;border-top:2px dashed ${ORANGE}"><p style="margin:0;font-size:38px;line-height:1.15;${TITEL}">${grussTitel(gruss1!)}</p></div>`
      : `<div style="margin-top:28px;padding-top:18px;border-top:2px dashed ${ORANGE}"><p style="margin:0;font-size:14px;line-height:1.6;color:#5c564d">${kontakt.map(z => zeile(z, basis)).join('<br>')}</p></div>`
  // Kopfzeile wie im Dorfanzeiger nur mit Rubrik (Rundbrief, Newsletter …); Termin-Mails kommen ohne
  const kopf = !rubrik ? '' : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;border-bottom:2px solid #16140F"><tr>`
    + `<td style="padding:0 0 8px;font-family:${DISPLAY};font-size:15px;font-weight:900;text-transform:uppercase;color:#16140F">Königsdorf rückt zusammen</td>`
    + `<td align="right" style="padding:0 0 8px;font-family:${DISPLAY};font-size:15px;font-weight:900;text-transform:uppercase;color:#16140F">${esc(rubrik ?? '')}</td>`
    + '</tr></table>'
  const fuss = [
    `<a href="${esc(basis)}/impressum" style="color:${PFIRSICH}">Impressum</a>`,
    `<a href="${esc(basis)}/datenschutz" style="color:${PFIRSICH}">Datenschutz</a>`,
    ...(abmelden ? [`<a href="${esc(abmelden)}" style="color:${PFIRSICH}">Abmelden</a>`] : []),
  ].join(' &nbsp;·&nbsp; ')

  return `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(vorschau ?? '')}</title>
<style>${schriften(basis)}</style></head>
<body style="margin:0;padding:0;background:${LILA}">
${vorschau ? `<div style="display:none;max-height:0;overflow:hidden">${esc(vorschau)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LILA}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px">
    <tr><td style="background:${CREME};border-radius:18px">
      <div style="padding:34px 32px;font-family:${SCHRIFT};font-size:16px;font-weight:300;line-height:1.65;color:#16140F">
${kopf}
${inhalt}
${gruss}
      </div>
    </td></tr>
    <tr><td align="center" style="padding:26px 0 0">
      <a href="${esc(basis)}"><img src="${esc(basis)}/mail/logo.png" width="150" height="72" alt="Königsdorf rückt zusammen" style="display:block;margin:0 auto;border:0;color:${CREME};font-family:${DISPLAY};font-size:22px;font-weight:900"></a>
    </td></tr>
    <tr><td align="center" style="padding:16px 4px 0;font-family:${SCHRIFT};font-size:12px;line-height:1.6;color:${PFIRSICH}">${fuss}</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}
