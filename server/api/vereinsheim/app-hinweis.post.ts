// POST /api/vereinsheim/app-hinweis – Popup „Vereinsheim aufs Handy“ gesehen: im eigenen Profil merken.
// Antwortet { gespeichert: false }, solange das Feld `app_hinweis_am` in Directus fehlt
// (dann merkt sich der Browser es selbst, siehe useVereinsheimApp).
export default defineEventHandler(async (event) => {
  try {
    await directusPerson(event, '/users/me', { method: 'PATCH', body: { app_hinweis_am: new Date().toISOString() } })
    return { gespeichert: true }
  }
  catch (e) {
    if ((e as { statusCode?: number }).statusCode === 401) throw e
    return { gespeichert: false }
  }
})
