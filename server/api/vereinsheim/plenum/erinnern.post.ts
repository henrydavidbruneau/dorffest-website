// POST /api/vereinsheim/plenum/erinnern – Erinnerung ans nächste Plenum an alle, die sich bestätigt
// eingetragen haben. „Nur das nächste“ wird danach abgemeldet. Jede Mail hat einen Abmelde-Link.
export default defineEventHandler(async (event) => {
  rateLimit(event, 'vereinsheim-plenum', 5)
  const body = await leseBody(event)
  const zusatz = typeof body.zusatz === 'string' ? body.zusatz.trim().slice(0, 2000) : ''
  const [plenum] = await directusPerson<{ titel: string, slug: string, beginn: string, ort: string | null, adresse: string | null }[]>(event, '/items/termine', {
    query: { fields: 'titel,slug,beginn,ort,adresse', filter: { slug: { _starts_with: 'plenum' }, status: { _eq: 'published' }, beginn: { _gte: '$NOW' } }, sort: 'beginn', limit: 1 },
  })
  if (!plenum) throw fail(404, 'plenum', 'Es ist kein kommendes Plenum eingetragen (Termin mit Adresse „plenum…“).')

  const empfaenger = await directusPerson<{ id: number, name: string | null, email: string, wie: string }[]>(event, '/items/plenum_erinnerungen', {
    query: { fields: 'id,name,email,wie', filter: { bestaetigt: { _eq: true }, abgemeldet_am: { _null: true } }, limit: -1 },
  })
  const wann = `${datumAusgeschrieben(plenum.beginn)}, ${uhrzeit(plenum.beginn)} Uhr`
  const wo = [plenum.ort, plenum.adresse].filter(Boolean).join(', ') || 'Ort folgt'
  const basis = seitenUrl(event)
  const jetzt = new Date().toISOString()
  let gesendet = 0
  for (const e of empfaenger) {
    const abmelden = linkSchluesselDa() ? `${basis}/api/plenum-erinnerung/abmelden?id=${e.id}&sig=${await signiere('plenum-abmelden', e.id)}` : null
    const ok = await sendeMail({
      an: e.email,
      betreff: `Erinnerung: ${plenum.titel} am ${tagMonat(plenum.beginn)}`,
      tags: ['plenum-erinnerung'],
      text: [
        `Hallo ${e.name || 'du'},`,
        `das nächste Plenum steht an – komm vorbei, hier wird entschieden, was wir als Nächstes machen!`,
        `Wann: ${wann}\nWo: ${wo}`,
        zusatz,
        `Alle Infos: ${basis}/termine/${plenum.slug}`,
        e.wie === 'naechstes' ? 'Du wolltest nur an dieses Plenum erinnert werden – danach schreiben wir dir nicht mehr.' : '',
        abmelden ? `Keine Erinnerungen mehr? ${abmelden}` : '',
        GRUSS,
      ].filter(Boolean).join('\n\n'),
    }).then(() => true, (err) => {
      console.error('[plenum-erinnerung]', e.email, err?.data ?? err)
      return false
    })
    if (!ok) continue
    gesendet++
    await directusPerson(event, `/items/plenum_erinnerungen/${e.id}`, {
      method: 'PATCH',
      body: { zuletzt_erinnert_am: jetzt, ...(e.wie === 'naechstes' ? { abgemeldet_am: jetzt } : {}) },
    })
  }
  return { gesendet, empfaenger: empfaenger.length }
})
