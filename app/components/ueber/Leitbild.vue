<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.ueberUns
</script>

<template>
  <section class="leitbild" aria-label="Wofür wir stehen">
    <div class="leitbild__text">
      <p v-for="a in t.absaetze" :key="a">{{ a }}</p>
    </div>

    <blockquote class="leitbild__kasten strich-oben-unten">
      <p>
        <template v-for="(teil, i) in t.leitbild" :key="i">
          <span v-if="teil.hervor" class="leitbild__hervor">{{ teil.text }}</span>
          <template v-else>{{ teil.text }}</template>
        </template>
      </p>
    </blockquote>

    <div class="leitbild__text">
      <p>{{ t.schluss }}</p>
    </div>
  </section>
</template>

<style scoped>
/* Design: Text 18/35 in einer 742 breiten Spalte, Leitbild 43px zwischen 1000 breiten Strichlinien */
.leitbild {
  padding: clamp(3rem, 7.6vw, 6.9rem) var(--seitenrand) clamp(3.5rem, 11vw, 10rem);
}

.leitbild__text {
  max-width: 46.5rem;
  margin-inline: auto;
  font-size: clamp(1rem, 1.25vw, 1.125rem);
  line-height: 1.95;
}

.leitbild__text p {
  margin: 0;
}

.leitbild__text p + p {
  margin-top: 1.5em;
}

.leitbild__kasten {
  max-width: 62.5rem;
  margin: clamp(2.5rem, 4.4vw, 4rem) auto;
  padding: clamp(2rem, 3.7vw, 3.3rem) 0;
}

.leitbild__kasten p {
  max-width: 54rem;
  margin: 0 auto;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.625rem, 3vw, 2.6875rem);
  line-height: 1.12;
  text-align: center;
  text-transform: uppercase;
  text-wrap: balance;
  color: var(--farbe-lila);
}

.leitbild__hervor {
  color: var(--farbe-orange);
}
</style>
