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

// Bilder aus Directus (…/assets/<id>) laufen über die eigene Bild-Route, weil Directus
// öffentlich nichts ausliefert. Drei Breiten fürs srcset.
const ASSET = /\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\?.*)?$/

function directusBild(href: string): string | null {
  const { directusUrl } = useRuntimeConfig()
  const basis = directusUrl.replace(/\/+$/, '')
  const treffer = href.match(ASSET)
  if (!treffer || !(href.startsWith(basis) || href.startsWith('/assets/'))) return null
  return treffer[1]!
}

function bildHtml(token: Tokens.Image) {
  const alt = escapeHtml(token.text)
  const id = directusBild(token.href.trim())
  if (id) {
    const url = (breite: number) => `/bilder/${id}?width=${breite}&amp;format=webp&amp;quality=80`
    return `<img src="${url(1480)}" srcset="${url(740)} 740w, ${url(1480)} 1480w, ${url(2200)} 2200w" sizes="(min-width: 800px) 740px, 100vw" alt="${alt}" loading="lazy" decoding="async">`
  }
  const src = sichereUrl(token.href, true)
  if (!src) return ''
  return `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" decoding="async">`
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
