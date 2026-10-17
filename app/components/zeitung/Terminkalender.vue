<script setup lang="ts">
defineProps<{ termine: Termin[] }>()

function datum(t: Termin) {
  if (t.rhythmus_kurz) return t.rhythmus_kurz
  return t.beginn ? `${tagMonat(t.beginn)}.` : (t.datum_text ?? '')
}

function zeile(t: Termin) {
  if (t.rhythmus_kurz && t.beginn) return `${uhrzeit(t.beginn).replace(':00', '')} Uhr`
  return t.ort ?? 'Ort folgt'
}
</script>

<template>
  <section class="kalender" aria-labelledby="kalender-titel">
    <h2 id="kalender-titel" class="kalender__titel">Terminkalender</h2>
    <ul class="kalender__liste">
      <li v-for="t in termine" :key="t.id" class="kalender__eintrag">
        <span class="kalender__datum">{{ datum(t) }}</span>
        <NuxtLink :to="`/termine/${t.slug}`" class="kalender__text">
          {{ t.titel }}<br>{{ zeile(t) }}
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Design: 286×293, gelb mit schwarzem 4px-Rahmen und gelbem Außenring */
.kalender {
  padding: 1.4rem 1.6rem 1.5rem;
  border: 4px solid var(--farbe-schwarz);
  border-radius: var(--radius-l);
  background: var(--farbe-gelb);
  box-shadow: 0 0 0 5px var(--farbe-gelb);
}

.kalender__titel {
  padding-bottom: 0.6rem;
  font-size: clamp(1.375rem, 1.8vw, 1.625rem);
  color: var(--farbe-schwarz);
}

.kalender__liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

.kalender__eintrag {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.5rem;
  padding-block: 0.65rem;
  border-top: 2px dashed rgb(0 0 0 / 0.35);
}

.kalender__datum {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.125rem, 1.39vw, 1.25rem);
}

.kalender__text {
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.35;
  text-decoration: none;
}

.kalender__text:hover {
  text-decoration: underline;
}
</style>
