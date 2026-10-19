// Zustand eines Formulars: senden → fertig | fehler (mit der Meldung vom Server)
export function useFormular(url: MaybeRefOrGetter<string>) {
  const status = ref<'bereit' | 'sendet' | 'fertig' | 'fehler'>('bereit')
  const fehler = ref('')

  // FormData für Formulare mit Datei (multipart), sonst JSON
  async function senden(daten: Record<string, unknown> | FormData) {
    status.value = 'sendet'
    fehler.value = ''
    try {
      await $fetch(toValue(url), { method: 'POST', body: daten })
      status.value = 'fertig'
    }
    catch (e) {
      const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
      fehler.value = err.data?.statusMessage || err.statusMessage || 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.'
      status.value = 'fehler'
    }
    finally {
      if (import.meta.client) turnstileZuruecksetzen()
    }
  }

  return { status, fehler, senden }
}
