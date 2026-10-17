<script setup lang="ts">
import { links } from '~/navigation'
</script>

<template>
  <aside class="mitglied" aria-label="Mitmachen">
    <p class="mitglied__titel">Mach mit!</p>
    <p class="mitglied__text">Bring deine eigenen Ideen ein!</p>
    <NuxtLink :to="links.mitmachen" class="mitglied__link handlink">→ Mehr erfahren</NuxtLink>
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
