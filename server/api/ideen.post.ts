// POST /api/ideen – Idee an die Ideenwand pinnen (sofort sichtbar, moderierbar)
export default defineEventHandler(event => pinneAn(event, 'ideen', { textMin: 3, textMax: 280 }))
