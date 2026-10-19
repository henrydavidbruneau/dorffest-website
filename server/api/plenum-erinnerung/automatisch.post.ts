// POST /api/plenum-erinnerung/automatisch – ruft der Netlify-Zeitplan jeden Morgen auf
// (netlify/functions/plenum-erinnerung.mjs). Ist das nächste Plenum höchstens
// ERINNERUNG_TAGE_VORHER Tage entfernt, bekommen alle bestätigten Abos ihre Erinnerung –
// jede*r nur einmal pro Treffen (`zuletzt_erinnert_am`).
interface PlenumZeile { titel: string, slug: string, ort: string | null, adresse: string | null, beginn: string | null, ende: string | null, wiederholung?: string | null, wiederholung_bis?: string | null }

export default defineEventHandler(async (event) => {
  if (!istZeitplanAufruf(event)) throw fail(401, 'schluessel', 'Nicht erlaubt')

  const termine = await directusServer<PlenumZeile[]>('/items/termine', {
    query: { fields: '*', filter: { slug: { _starts_with: 'plenum' }, status: { _eq: 'published' } }, limit: 10 },
  })
  const jetzt = Date.now()
  const naechstes = termine
    .map(t => ({ t, v: naechstesVorkommen(t, jetzt) }))
    .filter(x => x.v && Date.parse(x.v.beginn) > jetzt)
    .sort((a, b) => Date.parse(a.v!.beginn) - Date.parse(b.v!.beginn))[0]
  if (!naechstes) return { gesendet: 0, grund: 'kein kommendes Plenum' }
  const beginn = naechstes.v!.beginn
  if (Date.parse(beginn) - jetzt > ERINNERUNG_TAGE_VORHER * 86_400_000) return { gesendet: 0, grund: `nächstes Plenum erst am ${tagMonat(beginn)}` }

  // wer für dieses Treffen schon erinnert wurde, bekommt nichts mehr (Zeitplan läuft täglich)
  const schonErinnert = new Date(Date.parse(beginn) - 7 * 86_400_000).toISOString()
  const abos = await directusServer<PlenumAbo[]>('/items/plenum_erinnerungen', {
    query: {
      fields: 'id,name,email,wie',
      filter: { bestaetigt: { _eq: true }, abgemeldet_am: { _null: true }, _or: [{ zuletzt_erinnert_am: { _null: true } }, { zuletzt_erinnert_am: { _lt: schonErinnert } }] },
      limit: -1,
    },
  })
  const speichern = (id: number, daten: Record<string, unknown>) => directusServer(`/items/plenum_erinnerungen/${id}`, { method: 'PATCH', body: daten })
  let gesendet = 0
  for (const abo of abos) {
    if (await erinnereAnsPlenum(event, naechstes.t, beginn, abo, speichern)) gesendet++
  }
  console.info(`[plenum-erinnerung] ${gesendet}/${abos.length} Erinnerungen für ${tagMonat(beginn)} verschickt`)
  return { gesendet, empfaenger: abos.length, plenum: beginn }
})
