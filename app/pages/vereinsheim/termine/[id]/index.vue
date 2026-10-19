<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Termin · Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const VORLAGE = { status: 'draft', uhrzeit_folgt: false, hervorgehoben: false, anmeldung_aktiv: false, mitbringen_position: 'aus' }
const { zeige } = useVereinsheimMeldung()

// Nextup: höchstens ein Termin – wer hier den Haken setzt, nimmt ihn beim bisherigen weg
async function gespeichert(daten: Record<string, unknown>) {
  if (!daten.im_fokus) return
  const andere = await vh.liste<{ id: number, titel: string }>('termine', { fields: 'id,titel', filter: { im_fokus: { _eq: true }, id: { _neq: daten.id ?? id.value } } }).catch(() => [])
  for (const a of andere) await vh.aendern('termine', a.id, { im_fokus: false }).catch(() => {})
  if (andere.length) zeige(`„${andere[0]!.titel}“ ist nicht mehr im Nextup.`)
}
</script>

<template>
  <VereinsheimFormularSeite :id="id" collection="termine" :felder="FELDER_TERMIN" :gruppen="GRUPPEN_TERMIN" :vorlage="VORLAGE" zurueck="/vereinsheim/termine" art="Termin" @gespeichert="gespeichert">
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
