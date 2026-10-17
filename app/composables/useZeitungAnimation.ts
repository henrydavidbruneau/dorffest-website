/**
 * Soll das Zeitungsblatt hereinfliegen?
 * Ja beim ersten Laden und wenn man von außerhalb des Dorfanzeigers kommt,
 * nein beim Wechsel zwischen Dorfanzeiger-Seiten (sonst springt die Seite und animiert erneut).
 */
export function useZeitungAnimation() {
  const vorher = useState<string | null>('vorherigeRoute', () => null)
  const nuxtApp = useNuxtApp()
  if (import.meta.server || nuxtApp.isHydrating) return true
  return !vorher.value?.startsWith('/dorfanzeiger')
}
