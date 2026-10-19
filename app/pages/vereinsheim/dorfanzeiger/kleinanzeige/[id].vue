<script setup lang="ts">
import { KONTAKT_MAIL } from '#shared/utils/kontakt'

definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Kleinanzeige · Vereinsheim', robots: 'noindex, nofollow' })
const route = useRoute()
const id = computed(() => String(route.params.id))
const vorlage = { status: 'draft', link_text: 'melde dich!', ziel_email: KONTAKT_MAIL }
</script>

<template>
  <VereinsheimFormularSeite
    :id="id"
    collection="kleinanzeigen"
    :felder="FELDER_KLEINANZEIGE"
    :vorlage="vorlage"
    zurueck="/vereinsheim/dorfanzeiger/kleinanzeige"
    art="Kleinanzeige"
    titel-feld="ueberschrift"
  />
</template>
