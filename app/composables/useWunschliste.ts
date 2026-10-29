// Wunschliste eines Termins (z.B. Songwünsche): laden, Wunsch eintragen, dafür stimmen.
// Stimmen zählen sofort im Browser (meiste Stimmen nach oben), der Server liefert danach den echten Stand.
export function useWunschliste(slug: MaybeRefOrGetter<string>) {
  const url = () => `/api/termine/${toValue(slug)}/wuensche`
  const { data: wuensche, refresh } = useFetch<WunschMitStimmen[]>(url, { default: () => [] })
  const status = ref<'bereit' | 'sendet' | 'fertig' | 'fehler'>('bereit')
  const fehler = ref('')
  const meldung = ref('')

  const fehlertext = (e: unknown) => (e as { data?: { statusMessage?: string } }).data?.statusMessage || 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.'
  const sortiert = (liste: WunschMitStimmen[]) => [...liste].sort((a, b) => b.stimmen - a.stimmen)

  async function wuenschen(daten: { text: string, name: string, website: string, turnstile: string }) {
    status.value = 'sendet'
    fehler.value = ''
    try {
      const r = await $fetch<{ doppelt: boolean }>(url(), { method: 'POST', body: daten })
      meldung.value = r.doppelt ? 'Den hat sich schon jemand gewünscht – deine Stimme ist dazugezählt!' : 'Danke! Dein Wunsch steht auf der Liste.'
      await refresh()
      status.value = 'fertig'
      return true
    }
    catch (e) {
      fehler.value = fehlertext(e)
      status.value = 'fehler'
      return false
    }
    finally {
      turnstileZuruecksetzen()
    }
  }

  async function stimmen(wunsch: WunschMitStimmen) {
    const vorher = wuensche.value
    const an = !wunsch.meine
    wuensche.value = sortiert(vorher.map(w => (w.id === wunsch.id ? { ...w, meine: an, stimmen: w.stimmen + (an ? 1 : -1) } : w)))
    try {
      wuensche.value = await $fetch<WunschMitStimmen[]>(`${url()}/${wunsch.id}/stimme`, { method: 'POST', body: { an } })
    }
    catch (e) {
      wuensche.value = vorher
      fehler.value = fehlertext(e)
    }
  }

  return { wuensche, status, fehler, meldung, wuenschen, stimmen }
}
