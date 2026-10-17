<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.ueberUns.ideen
</script>

<template>
  <section class="ideen" aria-labelledby="ideen-titel">
    <div class="ideen__raster inhalt-breit">
      <h2 id="ideen-titel" class="ideen__titel">
        Deine Ideen.<br>
        Neue Begegnungen.<br>
        <BasisHervorhebung>Unser Königsdorf.</BasisHervorhebung>
      </h2>
      <div class="ideen__text">
        <p v-for="a in t.absaetze" :key="a">{{ a }}</p>
        <p class="ideen__aufruf">{{ t.aufruf }}</p>
        <BasisKnopf to="#mitglied-werden">{{ t.knopf }}</BasisKnopf>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Design: Titel 85px links, Text 18/34 in 494px Spalte ab x=836 */
.ideen {
  padding-block: clamp(3.5rem, 8.6vw, 7.75rem) clamp(3.5rem, 4.2vw, 3.75rem);
}

.ideen__raster {
  display: grid;
  gap: var(--abstand-l);
}

.ideen__titel {
  font-size: clamp(2.5rem, 5.9vw, 5.3125rem);
  line-height: 0.95;
}

.ideen__titel :deep(.hervorhebung) {
  margin-top: 0.04em;
}

.ideen__text {
  max-width: 31rem;
  font-size: clamp(1rem, 1.25vw, 1.125rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.9;
}

.ideen__text p {
  margin: 0 0 1em;
}

.ideen__aufruf {
  font-weight: var(--gewicht-text-mittel);
  color: var(--farbe-lila);
}

.ideen__text :deep(.knopf) {
  margin-top: 0.75rem;
}

@media (min-width: 56rem) {
  .ideen__raster {
    grid-template-columns: 1fr 31rem;
    gap: var(--abstand-xl);
    align-items: start;
  }
}
</style>
