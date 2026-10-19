import type { H3Event } from 'h3'

// Plenum-Erinnerungen verschicken (automatisch über den Netlify-Zeitplan) und Abmelde-Links.
// Die Leute stehen in Directus `plenum_erinnerungen`; im Vereinsheim tauchen sie in der
// Anmeldeliste des Plenums auf (dort auch „Mail an alle Angemeldeten“).

export interface PlenumAbo { id: number, name: string | null, email: string, wie: string }

interface PlenumTermin { titel: string, slug: string, ort: string | null, adresse: string | null }

export async function plenumAbmeldeLink(event: H3Event, id: number): Promise<string | null> {
  return linkSchluesselDa() ? `${seitenUrl(event)}/api/plenum-erinnerung/abmelden?id=${id}&sig=${await signiere('plenum-abmelden', id)}` : null
}

/** Erinnerungs-Mail an eine Person; danach `zuletzt_erinnert_am` setzen („nur das nächste“ → abgemeldet) */
export async function erinnereAnsPlenum(event: H3Event, plenum: PlenumTermin, beginn: string, abo: PlenumAbo, speichern: (id: number, daten: Record<string, unknown>) => Promise<unknown>): Promise<boolean> {
  const wann = `${datumAusgeschrieben(beginn)}, ${uhrzeit(beginn)} Uhr`
  const wo = [plenum.ort, plenum.adresse].filter(Boolean).join(', ') || 'Ort folgt'
  const abmelden = await plenumAbmeldeLink(event, abo.id)
  const ok = await sendeMail({
    an: abo.email,
    betreff: `Erinnerung: ${plenum.titel} am ${tagMonat(beginn)}`,
    tags: ['plenum-erinnerung'],
    text: [
      `Hallo ${abo.name || 'du'},`,
      'das nächste Plenum steht an – komm vorbei, hier wird entschieden, was wir als Nächstes machen!',
      `Wann: ${wann}\nWo: ${wo}`,
      `Alle Infos: ${seitenUrl(event)}/termine/${plenum.slug}`,
      abo.wie === 'naechstes' ? 'Du wolltest nur an dieses Plenum erinnert werden – danach schreiben wir dir nicht mehr.' : '',
      abmelden ? `Keine Erinnerungen mehr? ${abmelden}` : '',
      GRUSS,
    ].filter(Boolean).join('\n\n'),
  }).then(() => true, (err) => {
    console.error('[plenum-erinnerung]', abo.email, err?.data ?? err)
    return false
  })
  if (ok) {
    const jetzt = new Date().toISOString()
    await speichern(abo.id, { zuletzt_erinnert_am: jetzt, ...(abo.wie === 'naechstes' ? { abgemeldet_am: jetzt } : {}) })
  }
  return ok
}
