// POST /api/leserbriefe – Leserbrief anpinnen (vorerst nur Prüfung + Log)
export default defineEventHandler(event => pinneAn(event, 'leserbriefe', { textMin: 10, textMax: 600 }))
