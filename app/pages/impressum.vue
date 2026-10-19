<script setup lang="ts">
import impressum from '~/inhalte/impressum.md?raw'

useSeoMeta({ title: 'Impressum', description: 'Impressum des Vereins „Königsdorf rückt zusammen e.V.“', robots: 'noindex' })
</script>

<template>
  <BasisTextseite zusatz="wer wir sind" titel="Impressum" :inhalt="impressum" />
</template>
