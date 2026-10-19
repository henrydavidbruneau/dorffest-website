<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Ausgabe · Vereinsheim', robots: 'noindex, nofollow' })
const route = useRoute()
const id = computed(() => String(route.params.id))
const vorlage = { jahr: new Date().getFullYear() }
</script>

<template>
  <VereinsheimFormularSeite
    :id="id"
    collection="ausgaben"
    :felder="FELDER_AUSGABE"
    :vorlage="vorlage"
    zurueck="/vereinsheim/dorfanzeiger/ausgabe"
    art="Ausgabe"
    titel-feld="motto"
    :veroeffentlichen="false"
  />
</template>
