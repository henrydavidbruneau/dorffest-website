<script setup lang="ts">
import { texte } from '~/texte'

useSeoMeta({
  title: 'Startseite',
  description: texte.meta.beschreibung,
  ogTitle: 'Königsdorf rückt zusammen',
  ogDescription: texte.meta.beschreibung,
})
</script>

<template>
  <div class="startseite">
    <StartHero />
    <StartWasWirTun />
    <StartWegweiser von="#knopf-was-wir-tun" nach="#was-wir-tun-titel" />
    <StartWasKommt />
    <StartWasBisherGeschah />
    <StartNimmDirEinen />
    <StartFragen />
  </div>
</template>

<style scoped>
.startseite {
  position: relative;
}
</style>
