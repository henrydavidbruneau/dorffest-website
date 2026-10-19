// GET /api/vereinsheim/ich – wer ist angemeldet? 401 = niemand
export default defineEventHandler(event => ich(event))
