<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Mitglied · Vereinsheim', robots: 'noindex, nofollow' })
const route = useRoute()
const id = computed(() => String(route.params.id))
const vorlage = { status: 'aktiv', art: 'foerder', mitglied_seit: new Date().toISOString().slice(0, 10) }
</script>

<template>
  <VereinsheimFormularSeite
    :id="id"
    collection="mitglieder"
    :felder="FELDER_MITGLIED"
    :vorlage="vorlage"
    zurueck="/vereinsheim/mitglieder"
    art="Mitglied"
    titel-feld="nachname"
    :veroeffentlichen="false"
  />
</template>
