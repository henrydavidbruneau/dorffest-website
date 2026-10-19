<script setup lang="ts">
import datenschutz from '~/inhalte/datenschutz.md?raw'

useSeoMeta({ title: 'Datenschutz', description: 'Wie „Königsdorf rückt zusammen e.V.“ mit deinen Daten umgeht.', robots: 'noindex' })
</script>

<template>
  <BasisTextseite zusatz="deine Daten" titel="Datenschutz" :inhalt="datenschutz" />
</template>
