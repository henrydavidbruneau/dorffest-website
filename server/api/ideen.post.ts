// POST /api/ideen – Idee an die Ideenwand pinnen (vorerst nur Prüfung + Log)
export default defineEventHandler(event => pinneAn(event, 'ideen', { textMin: 3, textMax: 280 }))
