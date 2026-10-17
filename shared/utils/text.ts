/** reine Textabsätze eines Markdown-Texts (ohne Überschriften, Bilder, Zitate) – für Vorschauen */
export function textAbsaetze(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map(a => a.trim())
    .filter(a => a && !/^(#|>|!\[)/.test(a))
}
