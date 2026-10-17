<script setup lang="ts">
import { texte } from '~/texte'

useSeoMeta({
  title: 'Über uns',
  description: texte.ueberUns.meta,
  ogTitle: 'Über uns – Königsdorf rückt zusammen',
  ogDescription: texte.ueberUns.meta,
})
</script>

<template>
  <div>
    <UeberHero />
    <UeberLeitbild />
    <UeberStimmen />
    <UeberIdeen />
    <UeberAusweis />
  </div>
</template>
