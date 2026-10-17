<script setup lang="ts">
import { texte } from '~/texte'

useSeoMeta({
  title: 'Startseite',
  description: texte.meta.beschreibung,
})
</script>

<template>
  <section class="baustelle">
    <h1>Königsdorf rückt zusammen</h1>
    <p>Hier entsteht die neue Seite. Bis bald im Dorf!</p>
  </section>
</template>

<style scoped>
.baustelle {
  display: grid;
  place-items: center;
  gap: 1rem;
  padding: var(--abstand-2xl) var(--seitenrand);
  text-align: center;
}
</style>
