<script setup lang="ts">
import datenschutz from '~/inhalte/datenschutz.md?raw'

useSeoMeta({ title: 'Datenschutz', robots: 'noindex' })
</script>

<template>
  <BasisTextseite zusatz="deine Daten" titel="Datenschutz" :inhalt="datenschutz" />
</template>
