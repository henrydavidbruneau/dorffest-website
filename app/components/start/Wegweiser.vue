<script setup lang="ts">
// Gestrichelter Pfeil vom "Was wir tun"-Knopf im Hero zur Überschrift der Sektion,
// mit Tanzpaar und "hier entlang" – wie im Design. Wird aus den echten Positionen
// berechnet und bei jeder Größenänderung neu gezeichnet.
//
// Aufbau-Animation: Nach dem Hero zeichnet sich die Linie Stück für Stück (Maske mit
// wachsender Strichlänge). "hier entlang" und das Tanzpaar ploppen auf, sobald die
// Linie an ihnen vorbeikommt – die Stellen werden aus dem echten Pfad berechnet.
import { texte } from '~/texte'

const props = defineProps<{
  /** CSS-Selektoren für Start (Knopf) und Ziel (Überschrift) */
  von: string
  nach: string
}>()

const flaeche = ref<HTMLElement>()
const pfad = ref('')
const spitze = ref('')
const tanzpaar = ref<{ x: number, y: number, breite: number } | null>(null)
const hinweis = ref<{ x: number, y: number } | null>(null)

// Animation
const START_MS = 1900
const DAUER_MS = 2400
const maskeId = useId()
const linie = ref<SVGPathElement>()
const laenge = ref(0)
const fortschritt = ref(1)
const zeichnet = ref(false)
const anteilHinweis = ref(0.25)
const anteilTanzpaar = ref(0.6)
const hinweisDa = computed(() => !zeichnet.value || fortschritt.value >= anteilHinweis.value)
const tanzpaarDa = computed(() => !zeichnet.value || fortschritt.value >= anteilTanzpaar.value)
const spitzeDa = computed(() => !zeichnet.value || fortschritt.value >= 0.985)

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Anteil der Pfadlänge, an dem der Pfad einem Punkt am nächsten kommt */
function anteilBei(el: SVGPathElement, x: number, y: number) {
  const L = el.getTotalLength()
  let besterAbstand = Infinity
  let bester = 0
  for (let i = 0; i <= 200; i++) {
    const p = el.getPointAtLength((L * i) / 200)
    const d = (p.x - x) ** 2 + (p.y - y) ** 2
    if (d < besterAbstand) {
      besterAbstand = d
      bester = i / 200
    }
  }
  return bester
}

function animationStarten() {
  if (!linie.value || !pfad.value) return
  laenge.value = linie.value.getTotalLength()
  if (hinweis.value) anteilHinweis.value = anteilBei(linie.value, hinweis.value.x, hinweis.value.y + 20)
  if (tanzpaar.value) anteilTanzpaar.value = anteilBei(linie.value, tanzpaar.value.x + tanzpaar.value.breite * 0.8, tanzpaar.value.y)
  fortschritt.value = 0
  zeichnet.value = true
  const beginn = performance.now() + START_MS
  const schritt = (jetzt: number) => {
    const t = Math.min(1, Math.max(0, (jetzt - beginn) / DAUER_MS))
    fortschritt.value = easeInOut(t)
    if (t < 1) requestAnimationFrame(schritt)
    else zeichnet.value = false
  }
  requestAnimationFrame(schritt)
}

// Auf schmalen Bildschirmen entfällt der Pfeil (wie besprochen)
const MOBIL = '(max-width: 47.99rem)'

function zeichnen() {
  if (window.matchMedia(MOBIL).matches) {
    pfad.value = ''
    spitze.value = ''
    tanzpaar.value = null
    hinweis.value = null
    return
  }
  const huelle = flaeche.value?.parentElement
  const start = document.querySelector(props.von)
  const ziel = document.querySelector(props.nach)
  if (!huelle || !start || !ziel) return

  const h = huelle.getBoundingClientRect()
  const s = start.getBoundingClientRect()
  const z = ziel.getBoundingClientRect()
  const inhalt = ziel.closest('.inhalt')?.getBoundingClientRect() ?? h

  // Maßstab relativ zum Design (Inhaltsbreite 1120, Höhe des Bogens 335)
  const k = Math.min(1, inhalt.width / 1120)
  const sx = s.left + s.width / 2 - h.left
  const sy = s.bottom - h.top + 2
  const ex = z.left - h.left + 45 * k
  const ey = z.top - h.top - 30 * k
  const ky = Math.max(0.4, (ey - sy) / 335)
  // äußerster Punkt des Bogens rechts (Design: 115px vor dem Inhaltsrand)
  const rx = inhalt.right - h.left - 115 * k
  const by = sy + 0.38 * (ey - sy)
  const mx = ex + 0.5 * (rx - ex)
  const my = sy + 0.66 * (ey - sy)

  const c2x = ex + 20 * k
  const c2y = ey - 60 * ky
  pfad.value = [
    `M ${sx} ${sy}`,
    `C ${sx + 15 * k} ${sy + 45 * ky}, ${rx - 10 * k} ${by - 75 * ky}, ${rx} ${by}`,
    `C ${rx} ${by + 55 * ky}, ${rx - 160 * k} ${my}, ${mx} ${my}`,
    `C ${mx - 300 * k} ${my + 15 * ky}, ${c2x} ${c2y}, ${ex} ${ey}`,
  ].join(' ')

  // Pfeilspitze entlang der Endtangente
  const winkel = Math.atan2(ey - c2y, ex - c2x)
  const laenge = 12
  const flanke = (w: number) => `${ex - laenge * Math.cos(winkel + w)} ${ey - laenge * Math.sin(winkel + w)}`
  spitze.value = `M ${flanke(0.6)} L ${ex} ${ey} L ${flanke(-0.6)}`

  // Tanzpaar steht auf dem Bogen (Design: 160 breit, Füße am tiefsten Punkt)
  const breite = Math.max(90, 160 * k)
  tanzpaar.value = { x: mx - breite * 0.8, y: my, breite }
  hinweis.value = { x: rx - 50 * k, y: sy + 27 * ky }
}

let beobachter: ResizeObserver | undefined

onMounted(async () => {
  const animieren = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.matchMedia(MOBIL).matches
  // bis die Animation startet, ist die Linie unsichtbar
  if (animieren) {
    zeichnet.value = true
    fortschritt.value = 0
  }
  zeichnen()
  await document.fonts?.ready
  zeichnen()
  await nextTick()
  if (animieren) animationStarten()
  beobachter = new ResizeObserver(() => zeichnen())
  if (flaeche.value?.parentElement) beobachter.observe(flaeche.value.parentElement)
  window.addEventListener('resize', zeichnen)
})

onBeforeUnmount(() => {
  beobachter?.disconnect()
  window.removeEventListener('resize', zeichnen)
})
</script>

<template>
  <div ref="flaeche" class="wegweiser" aria-hidden="true">
    <svg class="wegweiser__linie">
      <defs>
        <mask :id="maskeId" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100%" height="100%">
          <path
            :d="pfad"
            class="wegweiser__maske"
            :style="{ strokeDasharray: laenge, strokeDashoffset: laenge * (1 - fortschritt) }"
          />
        </mask>
      </defs>
      <path ref="linie" :d="pfad" :mask="zeichnet ? `url(#${maskeId})` : undefined" />
      <path :d="spitze" class="wegweiser__spitze" :class="{ 'wegweiser__da': spitzeDa }" />
    </svg>
    <span
      v-if="hinweis"
      class="wegweiser__hinweis handschrift"
      :class="{ wegweiser__da: hinweisDa }"
      :style="{ left: `${hinweis.x}px`, top: `${hinweis.y}px` }"
    >{{ texte.start.hero.hierEntlang }}</span>
    <img
      v-if="tanzpaar"
      src="/illustrationen/tanzpaar.svg"
      alt=""
      width="700"
      height="700"
      class="wegweiser__tanzpaar"
      :class="{ wegweiser__da: tanzpaarDa }"
      :style="{ left: `${tanzpaar.x}px`, top: `${tanzpaar.y}px`, width: `${tanzpaar.breite}px` }"
    >
  </div>
</template>

<style scoped>
.wegweiser {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

@media (max-width: 47.99rem) {
  .wegweiser {
    display: none;
  }
}

.wegweiser__linie {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.wegweiser__linie path {
  fill: none;
  stroke: var(--farbe-lila);
  stroke-width: 2;
  stroke-dasharray: 6 6;
  stroke-linecap: round;
}

.wegweiser__linie .wegweiser__spitze {
  stroke-dasharray: none;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.wegweiser__linie .wegweiser__maske {
  stroke: #fff;
  stroke-width: 8;
  stroke-dasharray: none;
}

/* "hier entlang" und Tanzpaar ploppen auf, wenn die Linie sie erreicht */
.wegweiser__hinweis,
.wegweiser__tanzpaar {
  opacity: 0;
  scale: 0.3;
  transition:
    opacity 0.3s ease,
    scale 0.6s cubic-bezier(0.34, 1.7, 0.5, 1);
}

.wegweiser__da {
  opacity: 1 !important;
  scale: 1;
}

@media (prefers-reduced-motion: reduce) {
  .wegweiser__hinweis,
  .wegweiser__tanzpaar,
  .wegweiser__spitze {
    transition: none;
  }
}

.wegweiser__hinweis {
  position: absolute;
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange);
  white-space: nowrap;
  transform: rotate(32deg);
  transform-origin: left top;
}

/* Bild um die eigene Höhe nach oben, damit die Füße auf dem Bogen stehen */
.wegweiser__tanzpaar {
  position: absolute;
  height: auto;
  transform: translateY(-86%);
  transform-origin: 50% 100%;
}
</style>
