// Vereinsheim: Session am Anfang jeder Anfrage erneuern (neue Cookies hängen an der Antwort)
// und Schreibzugriffe nur von der eigenen Seite annehmen (Schutz vor fremden Formularen).
export default defineEventHandler(async (event) => {
  const pfad = event.path
  if (!pfad.startsWith('/api/vereinsheim')) return
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    const herkunft = getRequestHeader(event, 'origin')
    const eigene = getRequestURL(event, { xForwardedHost: true }).origin
    if (herkunft && herkunft !== eigene) throw createError({ statusCode: 403, statusMessage: 'Fremde Herkunft' })
  }
  await erneuereWennNoetig(event)
})
