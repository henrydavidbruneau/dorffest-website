// POST /api/leserbriefe – Leserbrief anpinnen (sofort sichtbar, moderierbar)
export default defineEventHandler(event => pinneAn(event, 'leserbriefe', { textMin: 10, textMax: 600 }))
