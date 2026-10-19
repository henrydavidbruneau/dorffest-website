// POST /api/vereinsheim/artikel/:id/erschienen – nach dem Veröffentlichen aufgerufen:
// War der Artikel ein Gastbeitrag, bekommt die Autor*in einmalig „Dein Beitrag ist erschienen“.
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const artikel = await directusPerson<{ status: string, slug: string, titel: string }>(event, `/items/artikel/${id}`, { query: { fields: 'status,slug,titel' } })
  if (artikel.status !== 'published') return { gesendet: false }
  const beitraege = await directusPerson<{ id: number, autor_in: string, email: string }[]>(event, '/items/gastbeitraege', {
    query: { fields: 'id,autor_in,email', filter: { artikel: { _eq: id }, erschienen_mail_am: { _null: true } }, limit: -1 },
  })
  for (const b of beitraege) {
    await sendeMailStill({
      an: b.email,
      betreff: `Dein Beitrag ist erschienen: „${artikel.titel}“`,
      tags: ['gastbeitrag-erschienen'],
      rubrik: 'Dorfanzeiger',
      text: [
        `Hallo ${b.autor_in},`,
        '# Dein Beitrag ist ==erschienen!==',
        'dein Beitrag steht jetzt im Königsdorfer Dorfanzeiger – danke, dass du mitgeschrieben hast!',
        `[Zum Artikel](${seitenUrl(event)}/dorfanzeiger/${artikel.slug})`,
        'Erzähl’s gern weiter. Und wenn du wieder etwas zu erzählen hast: Wir freuen uns.',
        GRUSS,
      ].join('\n\n'),
    })
    await directusPerson(event, `/items/gastbeitraege/${b.id}`, { method: 'PATCH', body: { erschienen_mail_am: new Date().toISOString() } })
  }
  return { gesendet: beitraege.length > 0 }
})
