// Markdown → HTML für Dorfanzeiger-Artikel (serverseitig, damit Seiten nur fertiges HTML bekommen).
// Rohes HTML im Markdown wird escaped; Links/Bilder nur mit erlaubten Protokollen.
import { Marked, type Tokens } from 'marked'

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[z]!)
}

function sichereUrl(url: string, bild = false) {
  const u = url.trim()
  if (u.startsWith('/') || u.startsWith('#')) return u
  if (/^https:\/\//i.test(u)) return u
  if (!bild && /^(mailto:|http:\/\/)/i.test(u)) return u
  return null
}

function bildHtml(token: Tokens.Image) {
  const src = sichereUrl(token.href, true)
  if (!src) return ''
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}" loading="lazy" decoding="async">`
}

const markdown = new Marked({ gfm: true })

markdown.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text)
    },

    heading({ tokens, depth }) {
      // h1 ist der Artikeltitel; Zwischenüberschriften beginnen bei h2
      const ebene = Math.min(Math.max(depth, 2), 4)
      return `<h${ebene}>${this.parser.parseInline(tokens)}</h${ebene}>\n`
    },

    link({ href, title, tokens }) {
      const url = sichereUrl(href)
      const text = this.parser.parseInline(tokens)
      if (!url) return text
      const extern = /^https?:\/\//i.test(url)
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${extern ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`
    },

    image(token) {
      return bildHtml(token)
    },

    // Ein Bild allein im Absatz wird zur Abbildung; der Bildtitel ist die Bildunterschrift
    paragraph({ tokens }) {
      const inhalt = tokens.filter(t => !(t.type === 'text' && !t.raw.trim()))
      if (inhalt.length === 1 && inhalt[0]!.type === 'image') {
        const bild = inhalt[0] as Tokens.Image
        const unterschrift = bild.title ? `<figcaption>${escapeHtml(bild.title)}</figcaption>` : ''
        return `<figure>${bildHtml(bild)}${unterschrift}</figure>\n`
      }
      return `<p>${this.parser.parseInline(tokens)}</p>\n`
    },

    // Zitat; ein letzter Absatz mit "— Quelle" wird zur Quellenangabe
    blockquote({ tokens }) {
      const letzter = tokens.at(-1)
      let quelle = ''
      let rest = tokens
      if (letzter?.type === 'paragraph' && /^[—–-]\s/.test((letzter as Tokens.Paragraph).text)) {
        quelle = `<footer>${this.parser.parseInline((letzter as Tokens.Paragraph).tokens).replace(/^[—–-]\s*/, '')}</footer>`
        rest = tokens.slice(0, -1)
      }
      return `<blockquote>${this.parser.parse(rest)}${quelle}</blockquote>\n`
    },
  },
})

export function markdownZuHtml(text: string): string {
  return markdown.parse(text, { async: false }) as string
}
