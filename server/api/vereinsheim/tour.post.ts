// POST /api/vereinsheim/tour – Tour gemacht oder abgelehnt: im eigenen Profil merken.
// Antwortet { gespeichert: false }, solange das Feld `tour_erledigt_am` in Directus fehlt
// (dann merkt sich der Browser es selbst, siehe useVereinsheimTour).
export default defineEventHandler(async (event) => {
  try {
    await directusPerson(event, '/users/me', { method: 'PATCH', body: { tour_erledigt_am: new Date().toISOString() } })
    return { gespeichert: true }
  }
  catch (e) {
    if ((e as { statusCode?: number }).statusCode === 401) throw e
    return { gespeichert: false }
  }
})
