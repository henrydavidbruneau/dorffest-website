<script setup lang="ts">
// Runder Störer-Sticker im Kopfband: Kurzinfo zur Anmeldung, springt zum Anmeldezettel
const props = defineProps<{ termin: TerminDetail }>()

const zeilen = computed(() => {
  const t = props.termin
  if (t.vergangen) return ['war', 'schön!']
  if (!t.anmeldung_aktiv) return ['ohne', 'Anmeldung', 'kommen!']
  if (t.plaetze_frei === 0) return ['aus-', 'gebucht']
  if (t.plaetze_frei !== null) return ['nur noch', String(t.plaetze_frei), 'Plätze!']
  return ['jetzt', 'anmelden!']
})
const gross = computed(() => zeilen.value.length === 3 && /^\d+$/.test(zeilen.value[1]!))
const ziel = computed(() => (props.termin.vergangen ? undefined : '#anmeldung'))
</script>

<template>
  <component :is="ziel ? 'a' : 'p'" :href="ziel" class="sticker" :class="{ 'sticker--zahl': gross }">
    <span v-for="(z, i) in zeilen" :key="i" class="sticker__zeile">{{ z }}</span>
  </component>
</template>

<style scoped>
.sticker {
  display: grid;
  place-content: center;
  width: clamp(6.5rem, 10vw, 8.5rem);
  aspect-ratio: 1;
  margin: 0;
  border-radius: 50%;
  background: var(--farbe-orange);
  box-shadow: 0 6px 14px rgb(0 0 0 / 0.25);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1rem, 1.4vw, 1.25rem);
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-schwarz);
  transform: rotate(12deg);
  transition: transform var(--dauer-mittel) ease;
}

a.sticker:hover {
  transform: rotate(4deg) scale(1.05);
}

.sticker--zahl .sticker__zeile:nth-child(2) {
  font-size: 2.4em;
}
</style>
