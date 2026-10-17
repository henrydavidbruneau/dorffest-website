<script setup lang="ts">
import { texte } from '~/texte'

useSeoMeta({
  title: 'Startseite',
  description: texte.meta.beschreibung,
})
</script>

<template>
  <section class="baustelle">
    <img src="/logo.svg" alt="Königsdorf rückt zusammen" width="240" height="159">
    <h1>Königsdorf rückt zusammen</h1>
    <p>Hier entsteht die neue Seite. Bis bald im Dorf!</p>
  </section>
</template>

<style scoped>
.baustelle {
  display: grid;
  place-items: center;
  gap: 1rem;
  min-height: 100vh;
  padding: 1rem;
  text-align: center;
}
</style>
