// Pinnwand (Leserbriefe, Ideenwand): Einträge laden und neue sofort vorne anpinnen
export function usePinnwand<T extends { id: number }>(url: string) {
  const { data: eintraege } = useFetch<T[]>(url, { default: () => [] })
  const status = ref<'bereit' | 'sendet' | 'fertig' | 'fehler'>('bereit')
  const fehler = ref('')
  const neuId = ref<number | null>(null)

  async function anpinnen(daten: Record<string, unknown>) {
    status.value = 'sendet'
    fehler.value = ''
    try {
      const neu = await $fetch<unknown>(url, { method: 'POST', body: daten }) as T
      eintraege.value = [neu, ...eintraege.value]
      neuId.value = neu.id
      status.value = 'fertig'
      return true
    }
    catch (e) {
      const err = e as { data?: { statusMessage?: string } }
      fehler.value = err.data?.statusMessage || 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.'
      status.value = 'fehler'
      return false
    }
  }

  return { eintraege, status, fehler, neuId, anpinnen }
}
