<script setup lang="ts">
import { links } from '~/navigation'
</script>

<template>
  <aside class="mitglied" aria-label="Mitglied werden">
    <p class="mitglied__titel">Werde Mitglied!</p>
    <p class="mitglied__text">Entscheide mit, was im Dorf passiert.</p>
    <NuxtLink :to="links.mitgliedWerden" class="mitglied__link handlink">→ zum Antrag</NuxtLink>
  </aside>
</template>

<style scoped>
/* Design: 411×106, lila, mittig */
.mitglied {
  --farbe-fokus: var(--farbe-gelb);
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  padding: 1.1rem var(--abstand-m);
  background: var(--farbe-lila);
  text-align: center;
}

.mitglied p {
  margin: 0;
}

.mitglied__titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.0625rem, 1.25vw, 1.125rem);
  text-transform: uppercase;
  color: var(--farbe-pfirsich);
}

.mitglied__text {
  font-size: var(--groesse-xs);
  color: var(--farbe-creme);
}

.mitglied__link {
  font-size: 1.25rem;
  color: var(--farbe-pfirsich);
}
</style>
