<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Frage · Vereinsheim', robots: 'noindex, nofollow' })
const route = useRoute()
const id = computed(() => String(route.params.id))
</script>

<template>
  <VereinsheimFormularSeite :id="id" collection="faq" :felder="FELDER_FAQ" :vorlage="{ status: 'draft' }" zurueck="/vereinsheim/ueber-uns/frage" art="Frage" titel-feld="frage" />
</template>
