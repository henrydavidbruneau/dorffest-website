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
  <div>
    <StartHero />
    <StartWasWirTun />
    <StartWasKommt />
    <StartWasBisherGeschah />
    <StartNimmDirEinen />
    <StartFragen />
  </div>
</template>
