// „Fünf Fragen an …“: Artikel im Ressort „Porträts“ mit `portraet_name` / `portraet_zitat`.

export async function ladePortraets(ausgabe?: number): Promise<Portraet[]> {
  const artikel = await ladeArtikelListe({ ressort: 'portraets', ausgabe })
  return artikel
    .filter(a => a.portraet_name && a.portraet_zitat)
    .map(a => ({ id: a.id, name: a.portraet_name!, zitat: a.portraet_zitat!, bild: a.bild, bild_alt: a.bild_alt, artikel: a.slug, ausgabe: a.ausgabe }))
}
