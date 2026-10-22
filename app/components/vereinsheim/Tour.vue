<script setup lang="ts">
// Tour-Oberfläche: Vorschlag als Popup auf dem Dashboard, danach Schritt für Schritt ein Lichtkegel
// auf das jeweilige Element (`data-tour="…"`) und daneben eine Erklärkarte.
// Ist die Tour vorbei (gemacht, beendet oder abgelehnt), kommt einmalig „Vereinsheim aufs Handy“.
const tour = useVereinsheimTour()
const { aktiv, nr, schritt, schritte, vorschlagen } = tour
const route = useRoute()
const { zeige } = useVereinsheimMeldung()
const { ich } = useVereinsheimIch()

// Vorschlag erst nach einer Sekunde, damit man das Dashboard kurz sieht
const vorschlagBereit = ref(false)
const vorschlagKarte = ref<HTMLElement | null>(null)
onMounted(() => setTimeout(() => (vorschlagBereit.value = true), 1000))
const zeigeVorschlag = computed(() => vorschlagBereit.value && vorschlagen.value && route.path === '/vereinsheim')
watch(zeigeVorschlag, async (ja) => {
  if (!ja) return
  await nextTick()
  vorschlagKarte.value?.focus()
})

// ---------- Danach einmalig: Vereinsheim aufs Handy ----------
const app = useVereinsheimApp()
const appBereit = ref(false)
const appKarte = ref<HTMLElement | null>(null)
const appMoeglich = computed(() => route.path === '/vereinsheim' && !aktiv.value && !vorschlagen.value && app.offen.value)
let appUhr: ReturnType<typeof setTimeout> | undefined
watch(appMoeglich, (ja) => {
  clearTimeout(appUhr)
  appBereit.value = false
  if (!ja) return
  app.erkennen()
  // schon als App unterwegs: nichts zu zeigen (und nichts zu merken – am Rechner käme es dann noch)
  if (app.geraet.value === 'installiert') return
  appUhr = setTimeout(async () => {
    appBereit.value = true
    await nextTick()
    appKarte.value?.focus()
  }, 1200)
}, { immediate: true })
const zeigeApp = computed(() => appBereit.value && appMoeglich.value)

async function appFertig(installiert = false) {
  appBereit.value = false
  await app.gesehen()
  zeige(installiert ? 'Super! Und falls du es später noch mal brauchst: „Aufs Handy“ findest du in deinem Profil.' : 'Alles klar. „Vereinsheim aufs Handy“ findest du jederzeit in deinem Profil.')
}

async function appInstallieren() {
  await appFertig(await app.installieren())
}

// ---------- Lichtkegel ----------
const rahmen = ref<{ top: number, left: number, width: number, height: number } | null>(null)
const karte = ref<HTMLElement | null>(null)
const kartePos = ref<Record<string, string>>({})
/** mobil: Karte oben statt unten, wenn das Ziel in der unteren Hälfte liegt */
const mobilOben = ref(false)
const ABSTAND = 8

function ziel(): HTMLElement | null {
  if (!schritt.value?.ziel) return null
  const kandidaten = [...document.querySelectorAll<HTMLElement>(`[data-tour="${schritt.value.ziel}"]`)]
  return kandidaten.find((e) => {
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'
  }) ?? null
}

function messen() {
  const el = ziel()
  if (!el) {
    rahmen.value = null
    kartePos.value = {}
    return
  }
  const r = el.getBoundingClientRect()
  rahmen.value = { top: r.top - ABSTAND, left: r.left - ABSTAND, width: r.width + 2 * ABSTAND, height: r.height + 2 * ABSTAND }
  if (window.innerWidth < 640) {
    kartePos.value = {}
    mobilOben.value = r.top + r.height / 2 > window.innerHeight * 0.55
    return
  }
  // Karte unter das Ziel, sonst darüber; waagerecht im Fenster halten
  const breite = 360
  const hoehe = karte.value?.offsetHeight ?? 220
  const links = Math.min(Math.max(16, r.left), window.innerWidth - breite - 16)
  const unten = r.bottom + ABSTAND + 16
  const top = unten + hoehe < window.innerHeight ? unten : Math.max(16, r.top - ABSTAND - 16 - hoehe)
  kartePos.value = { top: `${top}px`, left: `${links}px` }
}

// Nach einem Seitenwechsel lädt der Inhalt erst – kurz nach dem Ziel suchen, dann ins Bild scrollen
let suche = 0
async function zeigen() {
  const meine = ++suche
  rahmen.value = null
  await nextTick()
  const bis = Date.now() + 2500
  while (schritt.value?.ziel && !ziel() && Date.now() < bis && meine === suche) await new Promise(r => setTimeout(r, 100))
  if (meine !== suche) return
  const el = ziel()
  if (el) {
    const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // mobil liegt die Karte unten – Ziel deshalb nach oben holen
    const hoch = el.getBoundingClientRect().height > window.innerHeight * 0.6 || window.innerWidth < 640
    el.scrollIntoView({ block: hoch ? 'start' : 'center', behavior: ruhig ? 'auto' : 'smooth' })
    await new Promise(r => setTimeout(r, ruhig ? 0 : 350))
  }
  messen()
  await nextTick()
  messen()
  karte.value?.focus()
}

watch([aktiv, nr, () => route.path], () => aktiv.value && zeigen())

function taste(e: KeyboardEvent) {
  if (zeigeVorschlag.value && e.key === 'Escape') return tour.spaeter()
  if (zeigeApp.value && e.key === 'Escape') return appFertig()
  if (!aktiv.value) return
  if (e.key === 'Escape') tour.beenden()
  else if (e.key === 'ArrowRight') weiter()
  else if (e.key === 'ArrowLeft' && nr.value > 0) tour.zuSchritt(nr.value - 1)
}
onMounted(() => {
  window.addEventListener('resize', messen)
  window.addEventListener('scroll', messen, { passive: true })
  window.addEventListener('keydown', taste)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', messen)
  window.removeEventListener('scroll', messen)
  window.removeEventListener('keydown', taste)
})

const letzter = computed(() => nr.value >= schritte.value.length - 1)
function weiter() {
  if (letzter.value) tour.beenden()
  else tour.zuSchritt(nr.value + 1)
}

async function nein() {
  await tour.erledigt()
  zeige('Alles klar. Die Tour findest du jederzeit in deinem Profil.')
}
</script>

<template>
  <!-- Vorschlag -->
  <div v-if="zeigeVorschlag" class="tour-vorschlag" role="dialog" aria-modal="true" aria-labelledby="tour-vorschlag-titel">
    <div ref="vorschlagKarte" class="tour-karte tour-karte--vorschlag" tabindex="-1">
      <p class="tour-karte__zaehler">Neu hier?</p>
      <h2 id="tour-vorschlag-titel" class="tour-karte__titel">Kleine Tour gefällig?</h2>
      <p class="tour-karte__text">In zwei Minuten zeigen wir dir die wichtigsten Ecken im Vereinsheim: Termine, Dorfanzeiger, Kasse und mehr.</p>
      <div class="tour-karte__knoepfe">
        <BasisKnopf groesse="klein" @click="tour.starten()">Tour starten</BasisKnopf>
        <button type="button" class="vh-aktion" @click="tour.spaeter()">Später</button>
        <button type="button" class="vh-aktion tour-karte__nein" @click="nein">Nein danke</button>
      </div>
    </div>
  </div>

  <!-- Danach einmalig: Vereinsheim aufs Handy -->
  <div v-if="zeigeApp" class="tour-vorschlag" role="dialog" aria-modal="true" aria-labelledby="app-hinweis-titel">
    <div ref="appKarte" class="tour-karte tour-karte--vorschlag" tabindex="-1">
      <p class="tour-karte__zaehler">Noch ein Tipp</p>
      <h2 id="app-hinweis-titel" class="tour-karte__titel">Das Vereinsheim aufs Handy</h2>
      <div class="tour-karte__text">
        <VereinsheimAppAnleitung :geraet="app.geraet.value" />
        <p v-if="ich?.vorstand" class="tour-karte__zusatz">Als App kann dir das Vereinsheim auch Bescheid geben, wenn neue Post da ist.</p>
      </div>
      <div class="tour-karte__knoepfe">
        <BasisKnopf v-if="app.geraet.value === 'knopf'" groesse="klein" @click="appInstallieren">Installieren</BasisKnopf>
        <BasisKnopf v-else groesse="klein" @click="appFertig()">Verstanden</BasisKnopf>
        <button type="button" class="vh-aktion tour-karte__nein" @click="appFertig()">Nein danke</button>
      </div>
    </div>
  </div>

  <!-- Tour -->
  <div v-if="aktiv && schritt" class="tour" role="dialog" aria-modal="true" aria-labelledby="tour-titel">
    <div v-if="rahmen" class="tour__kegel" :style="{ top: `${rahmen.top}px`, left: `${rahmen.left}px`, width: `${rahmen.width}px`, height: `${rahmen.height}px` }" />
    <div v-else class="tour__schleier" />

    <div ref="karte" class="tour-karte" :class="{ 'tour-karte--mitte': !rahmen, 'tour-karte--oben': rahmen && mobilOben }" :style="rahmen ? kartePos : {}" tabindex="-1">
      <p class="tour-karte__zaehler">{{ nr + 1 }} von {{ schritte.length }}</p>
      <h2 id="tour-titel" class="tour-karte__titel">{{ schritt.titel }}</h2>
      <p class="tour-karte__text">{{ schritt.text }}</p>
      <div class="tour-karte__knoepfe">
        <BasisKnopf groesse="klein" @click="weiter">{{ letzter ? 'Fertig' : nr === 0 ? 'Los geht’s' : 'Weiter' }}</BasisKnopf>
        <button v-if="nr > 0" type="button" class="vh-aktion" @click="tour.zuSchritt(nr - 1)">Zurück</button>
        <button v-if="!letzter" type="button" class="vh-aktion tour-karte__nein" @click="tour.beenden()">Beenden</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tour {
  position: fixed;
  inset: 0;
  z-index: 50;
}

/* Lichtkegel: ein Loch im dunklen Schleier (riesiger Schatten um den Rahmen) */
.tour__kegel {
  position: fixed;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 3px var(--farbe-gelb), 0 0 0 200vmax rgb(30 10 35 / 0.6);
  transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease;
  pointer-events: none;
}

.tour__schleier {
  position: fixed;
  inset: 0;
  background: rgb(30 10 35 / 0.6);
}

.tour-karte {
  position: fixed;
  z-index: 51;
  width: min(22.5rem, calc(100vw - 2rem));
  padding: var(--abstand-m);
  border-radius: 1rem;
  background: var(--farbe-creme);
  box-shadow: 0 16px 40px rgb(0 0 0 / 0.3);
  outline: none;
}

.tour-karte:focus-visible {
  box-shadow: 0 0 0 3px var(--farbe-lila), 0 16px 40px rgb(0 0 0 / 0.3);
}

.tour-karte--mitte {
  top: 50%;
  left: 50%;
  translate: -50% -50%;
}

.tour-karte__zaehler {
  margin: 0;
  color: #6b6259;
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
}

.tour-karte__titel {
  margin: 0.2rem 0 0.4rem;
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  line-height: 1.05;
  color: var(--farbe-lila);
}

.tour-karte__text {
  margin: 0;
  font-size: var(--groesse-s);
  line-height: 1.55;
}

.tour-karte__zusatz {
  margin: var(--abstand-xs) 0 0;
  font-size: var(--groesse-s);
}

.tour-karte__knoepfe {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-xs) var(--abstand-m);
  margin-top: var(--abstand-m);
}

.tour-karte__nein {
  margin-left: auto;
  color: #6b6259;
}

/* Vorschlag: mittig, Hintergrund leicht abgedunkelt */
.tour-vorschlag {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(30 10 35 / 0.45);
  animation: tour-schleier 0.3s ease-out;
}

.tour-karte--vorschlag {
  position: static;
  width: min(26rem, 100%);
  padding: var(--abstand-l);
  animation: tour-rein 0.35s ease-out;
}

.tour-karte--vorschlag:focus-visible {
  box-shadow: 0 16px 40px rgb(0 0 0 / 0.3);
}

@keyframes tour-schleier {
  from { opacity: 0; }
}

@keyframes tour-rein {
  from { opacity: 0; translate: 0 1rem; }
}

/* mobil: Karte unten über die ganze Breite */
@media (max-width: 39.99rem) {
  .tour-karte:not(.tour-karte--mitte):not(.tour-karte--vorschlag) {
    top: auto !important;
    right: 1rem;
    bottom: 1rem;
    left: 1rem !important;
    width: auto;
  }

  .tour-karte.tour-karte--oben:not(.tour-karte--mitte):not(.tour-karte--vorschlag) {
    top: 1rem !important;
    bottom: auto;
  }

}

@media (prefers-reduced-motion: reduce) {
  .tour__kegel,
  .tour-vorschlag,
  .tour-karte--vorschlag {
    transition: none;
    animation: none;
  }
}

@media print {
  .tour,
  .tour-vorschlag {
    display: none;
  }
}
</style>
