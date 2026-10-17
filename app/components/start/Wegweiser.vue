<script setup lang="ts">
// Gestrichelter Pfeil vom "Was wir tun"-Knopf im Hero zur Überschrift der Sektion,
// mit Tanzpaar und "hier entlang" – wie im Design. Wird aus den echten Positionen
// berechnet und bei jeder Größenänderung neu gezeichnet.
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
  zeichnen()
  await document.fonts?.ready
  zeichnen()
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
      <path :d="pfad" />
      <path :d="spitze" />
    </svg>
    <span
      v-if="hinweis"
      class="wegweiser__hinweis handschrift"
      :style="{ left: `${hinweis.x}px`, top: `${hinweis.y}px` }"
    >{{ texte.start.hero.hierEntlang }}</span>
    <img
      v-if="tanzpaar"
      src="/illustrationen/tanzpaar.svg"
      alt=""
      width="700"
      height="700"
      class="wegweiser__tanzpaar"
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

.wegweiser__linie path + path {
  stroke-dasharray: none;
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
}
</style>
