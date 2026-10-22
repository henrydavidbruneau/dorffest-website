// „Installieren“-Angebot des Browsers (Android/Chrome/Edge) früh abfangen – es kommt nur einmal
// pro Seitenaufruf, oft bevor das Vereinsheim fertig geladen ist (siehe useVereinsheimApp)
export default defineNuxtPlugin(() => {
  merkeInstallierAngebot()
})
