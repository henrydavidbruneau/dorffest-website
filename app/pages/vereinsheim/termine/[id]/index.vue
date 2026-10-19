<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Termin · Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const VORLAGE = { status: 'draft', uhrzeit_folgt: false, hervorgehoben: false, anmeldung_aktiv: false, mitbringen_position: 'aus' }
</script>

<template>
  <VereinsheimFormularSeite :id="id" collection="termine" :felder="FELDER_TERMIN" :gruppen="GRUPPEN_TERMIN" :vorlage="VORLAGE" zurueck="/vereinsheim/termine" art="Termin">
    <template #oben="{ daten }">
      <p v-if="id !== 'neu'" class="termin-links">
        <BasisKnopf :to="`/vereinsheim/termine/${id}/anmeldungen`" groesse="klein" variante="outline">Anmeldungen &amp; Rundmail</BasisKnopf>
        <a v-if="daten.status === 'published'" :href="`/termine/${daten.slug}`" target="_blank" rel="noopener">Auf der Website ansehen ↗</a>
      </p>
    </template>
  </VereinsheimFormularSeite>
</template>

<style scoped>
.termin-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s) var(--abstand-m);
  margin: 0;
  font-size: var(--groesse-xs);
}

.termin-links > a:not(.knopf) {
  color: var(--farbe-pfirsich);
}
</style>
