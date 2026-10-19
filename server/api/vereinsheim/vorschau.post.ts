// POST /api/vereinsheim/vorschau – Markdown so rendern, wie es auf der Website erscheint
export default defineEventHandler(async (event) => {
  await ich(event) // nur angemeldet
  const body = await leseBody(event)
  const markdown = typeof body.markdown === 'string' ? body.markdown.slice(0, 50000) : ''
  return { html: markdownZuHtml(markdown) }
})
