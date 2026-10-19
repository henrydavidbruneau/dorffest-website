// POST /api/vereinsheim/gastbeitraege/:id/annehmen|ablehnen
// Annehmen: Artikel-Entwurf mit Text, Bild und Autor*in anlegen, Foto in den Ordner `artikel`
// verschieben (damit die Website es zeigen darf), Gastbeitrag verknüpfen.
// Ablehnen: Status setzen, optional kurze Mail an die Person.
interface GastbeitragRoh {
  id: number
  status: string
  titel: string
  teaser: string | null
  inhalt: string
  ressort: number | null
  bild: string | null
  bildunterschrift: string | null
  foto_von: string | null
  autor_in: string
  email: string
}

const slugAus = (titel: string) => titel.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'gastbeitrag'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const aktion = getRouterParam(event, 'aktion')
  if (aktion !== 'annehmen' && aktion !== 'ablehnen') throw fail(404, 'aktion', 'Nicht gefunden')
  const person = await ich(event)
  const body = await leseBody(event)
  const beitrag = await directusPerson<GastbeitragRoh>(event, `/items/gastbeitraege/${id}`)
  if (beitrag.status !== 'eingereicht') throw fail(409, 'schon', 'Über diesen Beitrag wurde schon entschieden.')

  if (aktion === 'ablehnen') {
    await directusPerson(event, `/items/gastbeitraege/${id}`, { method: 'PATCH', body: { status: 'abgelehnt', geprueft_von: person.id } })
    const nachricht = typeof body.nachricht === 'string' ? body.nachricht.trim().slice(0, 2000) : ''
    if (nachricht) {
      await sendeMailStill({
        an: beitrag.email,
        betreff: `Dein Beitrag „${beitrag.titel}“`,
        tags: ['gastbeitrag'],
        text: `Hallo ${beitrag.autor_in},\n\n${nachricht}\n\n${GRUSS}`,
        antwortAn: echteMail(person.email) ?? undefined,
      })
    }
    return { ok: true }
  }

  // Slug frei machen, falls es ihn schon gibt
  let slug = slugAus(beitrag.titel)
  const vorhanden = await directusPerson<{ slug: string }[]>(event, '/items/artikel', { query: { fields: 'slug', filter: { slug: { _starts_with: slug } }, limit: -1 } })
  if (vorhanden.some(a => a.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`

  if (beitrag.bild) {
    const [ordner] = await directusPerson<{ id: string }[]>(event, '/folders', { query: { filter: { name: { _eq: 'artikel' }, parent: { _null: true } }, fields: 'id', limit: 1 } })
    if (ordner) await directusPerson(event, `/files/${beitrag.bild}`, { method: 'PATCH', body: { folder: ordner.id } })
  }
  const unterschrift = [beitrag.bildunterschrift, beitrag.foto_von ? `Foto: ${beitrag.foto_von}` : null].filter(Boolean).join(' · ') || null
  const artikel = await directusPerson<{ id: number }>(event, '/items/artikel', {
    method: 'POST',
    body: {
      status: 'draft',
      titel: beitrag.titel,
      slug,
      teaser: beitrag.teaser ?? '',
      inhalt: beitrag.inhalt,
      ressort: beitrag.ressort,
      autor_in: beitrag.autor_in,
      bild: beitrag.bild,
      bild_alt: beitrag.bild ? beitrag.titel : null,
      bildunterschrift: unterschrift,
      lesedauer_minuten: Math.max(1, Math.round(beitrag.inhalt.split(/\s+/).length / 200)),
    },
  })
  await directusPerson(event, `/items/gastbeitraege/${id}`, { method: 'PATCH', body: { status: 'angenommen', geprueft_von: person.id, artikel: artikel.id } })
  return { ok: true, artikel: artikel.id }
})
