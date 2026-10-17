// Merkt sich den Pfad der vorherigen Seite (z.B. um Animationen bei interner Navigation auszulassen)
export default defineNuxtPlugin(() => {
  const vorher = useState<string | null>('vorherigeRoute', () => null)
  useRouter().beforeEach((_to, from) => {
    vorher.value = from.matched.length ? from.path : null
  })
})
