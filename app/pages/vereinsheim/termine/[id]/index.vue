<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Termin · Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const VORLAGE = { status: 'draft', uhrzeit_folgt: false, hervorgehoben: false, anmeldung_aktiv: false, mitbringen_position: 'aus' }
</script>

<template>
  <VereinsheimFormularSeite :id="id" collection="termine" :felder="FELDER_TERMIN" :vorlage="VORLAGE" zurueck="/vereinsheim/termine" art="Termin">
    <template #oben="{ daten }">
      <p v-if="id !== 'neu'" class="termin-links">
        <NuxtLink :to="`/vereinsheim/termine/${id}/anmeldungen`">→ Anmeldungen &amp; Rundmail</NuxtLink>
        <a v-if="daten.status === 'published'" :href="`/termine/${daten.slug}`" target="_blank" rel="noopener">→ auf der Website ansehen ↗</a>
      </p>
    </template>
  </VereinsheimFormularSeite>
</template>

<style scoped>
.termin-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-m);
  margin: 0 0 var(--abstand-l);
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
}

.termin-links a {
  color: var(--farbe-orange-text);
}
</style>
