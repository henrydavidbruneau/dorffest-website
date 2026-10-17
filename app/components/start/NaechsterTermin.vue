<script setup lang="ts">
// Countdown-Band für den nächsten Termin (Startseite, "Was kommt")
const props = defineProps<{ termin: Termin }>()

const link = computed(() => `/termine/${props.termin.slug}`)

// Tage bis zum Termin, nach Kalendertagen in Ortszeit (heute/morgen/in X Tagen)
function tagNummer(d: Date) {
  const [j, m, t] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(d).split('-').map(Number)
  return Date.UTC(j!, m! - 1, t!) / 86400000
}

const countdown = computed(() => {
  const { beginn, datum_text } = props.termin
  if (!beginn) return datum_text ? `${datum_text}:` : 'demnächst:'
  const tage = tagNummer(new Date(beginn)) - tagNummer(new Date())
  if (tage <= 0) return 'heute:'
  if (tage === 1) return 'morgen:'
  return `in ${tage} Tagen:`
})

const zeile = computed(() => {
  const t = props.termin
  if (!t.beginn) return t.hinweis ?? ''
  return `${wochentagKurz(t.beginn)} ${tagMonat(t.beginn)} · ${uhrzeit(t.beginn)} Uhr · ${t.ort ?? 'Ort folgt'}`
})
</script>

<template>
  <article class="band">
    <div class="band__links">
      <p class="band__countdown handschrift">{{ countdown }}</p>
      <h3 class="band__titel">
        <NuxtLink :to="link" class="band__link">{{ termin.titel }}</NuxtLink>
      </h3>
      <p v-if="termin.kurzbeschreibung" class="band__text">{{ termin.kurzbeschreibung }}</p>
    </div>
    <div class="band__rechts">
      <p class="band__zeile">
        <time v-if="termin.beginn" :datetime="termin.beginn">{{ zeile }}</time>
        <template v-else>{{ zeile }}</template>
      </p>
      <span class="band__pfeil" aria-hidden="true">→</span>
    </div>
  </article>
</template>

<style scoped>
.band {
  position: relative;
  display: grid;
  gap: var(--abstand-s) var(--abstand-l);
  align-items: center;
  padding: clamp(1.5rem, 2.8vw, 2.5rem) clamp(1.5rem, 3.3vw, 3rem);
  border: 3px dashed var(--farbe-pfirsich);
  border-radius: var(--radius-xl);
  color: var(--farbe-creme);
  transition: background-color var(--dauer-mittel) ease;
}

.band:hover {
  background: rgb(255 255 255 / 0.06);
}

.band p {
  margin: 0;
}

.band__countdown {
  font-size: var(--groesse-hand-l);
  color: var(--farbe-orange);
  transform: rotate(-2deg);
  transform-origin: left;
}

.band__titel {
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  line-height: 0.9;
  color: var(--farbe-pfirsich);
}

.band__link {
  text-decoration: none;
}

/* ganzes Band klickbar */
.band__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.band:hover .band__link {
  text-decoration: underline;
  text-decoration-thickness: 3px;
}

.band .band__text {
  max-width: 34rem;
  margin-top: 0.6rem;
  font-size: var(--groesse-l);
  line-height: 1.55;
}

.band__rechts {
  display: flex;
  gap: var(--abstand-m);
  align-items: center;
  justify-content: space-between;
}

.band__zeile {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.125rem, 1.6vw, 1.4rem);
  line-height: 1.2;
  text-transform: uppercase;
  color: var(--farbe-pfirsich);
}

.band__pfeil {
  display: grid;
  flex: none;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--farbe-pfirsich);
  font-size: 1.75rem;
  color: var(--farbe-lila);
  transition: transform var(--dauer-mittel) ease;
}

.band:hover .band__pfeil {
  transform: translateX(4px);
}

@media (min-width: 56rem) {
  .band {
    grid-template-columns: 1fr auto;
  }

  .band__rechts {
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .band__zeile {
    max-width: 14rem;
  }
}
</style>
