<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Stimme · Vereinsheim', robots: 'noindex, nofollow' })
const route = useRoute()
const id = computed(() => String(route.params.id))
</script>

<template>
  <VereinsheimFormularSeite :id="id" collection="stimmen" :felder="FELDER_STIMME" :vorlage="{ status: 'draft' }" zurueck="/vereinsheim/ueber-uns/stimme" art="Stimme aus dem Verein" titel-feld="name" />
</template>
