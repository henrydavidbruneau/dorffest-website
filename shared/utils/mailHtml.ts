// Mails im Look der Website: lila Rahmen, Creme-Karte, Logo, Knöpfe, Gruß unter gestrichelter Linie.
// Geschrieben wird weiter Klartext (Leerzeile = Absatz); dazu zwei kleine Auszeichnungen:
//   [Knopftext](https://…)  allein in einem Absatz = lila Knopf, sonst Link
//   **fett**
// Läuft auf dem Server (Versand) und im Vereinsheim (Vorschau) – darum nur Inline-Styles, Tabellen
// und keine Web-Schriften (Mailprogramme laden die nicht zuverlässig, Gmail gar nicht).

const LILA = '#7A2A7E'
const CREME = '#FFFDF7'
const PFIRSICH = '#FCE0C5'
const ORANGE = '#E8820C'
const SCHRIFT = '\'Poppins\', \'Helvetica Neue\', Arial, sans-serif'
const DISPLAY = '\'Londrina Solid\', Impact, \'Arial Black\', sans-serif'

const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g
const KNOPF = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)$/

function esc(text: string) {
  return text.replace(/[&<>"']/g, z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[z]!)
}

/** Klartext-Fassung: [Text](url) → „Text: url“, **fett** → fett */
export function mailText(text: string) {
  return text.replace(LINK, '$1: $2').replace(/\*\*([^*\n]+)\*\*/g, '$1')
}

function knopf(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="border-radius:8px;background:${LILA}">`
    + `<a href="${esc(url)}" style="display:inline-block;padding:13px 24px;font-family:${DISPLAY};font-size:17px;font-weight:900;letter-spacing:0.02em;text-transform:uppercase;color:${CREME};text-decoration:none;border-radius:8px">${esc(text)}</a>`
    + '</td></tr></table>'
}

function zeile(absatz: string) {
  // erst Links/Fettes markieren, dann escapen, dann wieder einsetzen
  const teile: string[] = []
  const merke = (html: string) => `\uE000${teile.push(html) - 1}\uE000`
  let t = absatz
    .replace(LINK, (_, text: string, url: string) => merke(`<a href="${esc(url)}" style="color:${LILA};font-weight:700">${esc(text)}</a>`))
    .replace(/https?:\/\/[^\s<]+/g, url => merke(`<a href="${esc(url)}" style="color:${LILA};word-break:break-all">${esc(url)}</a>`))
  t = esc(t)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
  return t.replace(/\uE000(\d+)\uE000/g, (_, i: string) => teile[Number(i)]!)
}

export interface MailHtmlOptionen {
  /** Adresse der Website (für Logo und Links im Fuß), z.B. https://koenigsdorf-rueckt-zusammen.de */
  basis: string
  /** Abmelde-Link im Fuß (Newsletter: Brevo-Platzhalter `{{ unsubscribe }}`) */
  abmelden?: string
  /** kurzer Vorschautext im Postfach (nicht sichtbar) */
  vorschau?: string
}

export function mailHtml(text: string, { basis, abmelden, vorschau }: MailHtmlOptionen): string {
  const absaetze = text.replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/)
  // der Gruß am Ende bekommt die gestrichelte Linie wie auf der Website
  const grussDa = absaetze.at(-1)?.trim() === GRUSS
  const inhalt = (grussDa ? absaetze.slice(0, -1) : absaetze).map((a) => {
    const k = a.trim().match(KNOPF)
    if (k) return knopf(k[1]!, k[2]!)
    if (/^https?:\/\/\S+$/.test(a.trim())) return knopf('Link öffnen', a.trim())
    return `<p style="margin:0 0 18px">${zeile(a.trim())}</p>`
  }).join('\n')
  const [gruss1, ...grussRest] = GRUSS.split('\n')
  const gruss = grussDa
    ? `<div style="margin-top:28px;padding-top:20px;border-top:2px dashed ${ORANGE}">`
    + `<p style="margin:0;font-family:${DISPLAY};font-size:24px;font-weight:900;line-height:1.1;text-transform:uppercase;color:${LILA}">${esc(gruss1!)}</p>`
    + `<p style="margin:6px 0 0;font-size:14px;color:#5c564d">${grussRest.map(z => zeile(z)).join('<br>')}</p></div>`
    : ''
  const fuss = [
    'Rückt Zusammen e.V. · Königsdorf',
    `<a href="${esc(basis)}" style="color:${PFIRSICH}">Website</a>`,
    `<a href="${esc(basis)}/impressum" style="color:${PFIRSICH}">Impressum</a>`,
    `<a href="${esc(basis)}/datenschutz" style="color:${PFIRSICH}">Datenschutz</a>`,
    ...(abmelden ? [`<a href="${esc(abmelden)}" style="color:${PFIRSICH}">Abmelden</a>`] : []),
  ].join(' &nbsp;·&nbsp; ')

  return `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(vorschau ?? '')}</title></head>
<body style="margin:0;padding:0;background:${LILA}">
${vorschau ? `<div style="display:none;max-height:0;overflow:hidden">${esc(vorschau)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LILA}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
    <tr><td style="padding:0 0 18px">
      <a href="${esc(basis)}"><img src="${esc(basis)}/mail/logo.png" width="150" height="72" alt="Königsdorf rückt zusammen" style="display:block;border:0;color:${CREME};font-family:${DISPLAY};font-size:22px"></a>
    </td></tr>
    <tr><td style="background:${CREME};border-radius:16px;padding:32px 28px;font-family:${SCHRIFT};font-size:16px;line-height:1.6;color:#1a1a1a">
${inhalt}
${gruss}
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-family:${SCHRIFT};font-size:12px;line-height:1.6;color:${PFIRSICH}">${fuss}</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}
