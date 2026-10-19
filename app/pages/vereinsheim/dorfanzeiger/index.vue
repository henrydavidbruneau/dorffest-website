<script setup lang="ts">
// Redaktionstisch des Dorfanzeigers: vier Reiter
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim', vollbreit: true })
useSeoMeta({ title: 'Dorfanzeiger · Vereinsheim', robots: 'noindex, nofollow' })

const reiter = ref('artikel')
const { data: neu } = useAsyncData('vh-dorfanzeiger-neu', async () => ({
  gastbeitraege: await vh.anzahl('gastbeitraege', { status: { _eq: 'eingereicht' } }).catch(() => 0),
  leserbriefe: await vh.anzahl('leserbriefe', { date_created: { _gte: '$NOW(-7 days)' } }).catch(() => 0),
}), { server: false })
</script>

<template>
  <VereinsheimZeitung titel="Redaktion">
    <template #ressorts>
      <VereinsheimReiter
        v-model="reiter"
        stil="zeitung"
        :reiter="[
          { key: 'artikel', text: 'Artikel' },
          { key: 'kleinanzeigen', text: 'Kleinanzeigen' },
          { key: 'leserbriefe', text: 'Leserbriefe', anzahl: neu?.leserbriefe },
          { key: 'gastbeitraege', text: 'Gastbeiträge', anzahl: neu?.gastbeitraege },
        ]"
      />
    </template>
    <VereinsheimDorfanzeigerArtikel v-if="reiter === 'artikel'" />
    <VereinsheimDorfanzeigerKleinanzeigen v-else-if="reiter === 'kleinanzeigen'" />
    <VereinsheimDorfanzeigerLeserbriefe v-else-if="reiter === 'leserbriefe'" />
    <VereinsheimDorfanzeigerGastbeitraege v-else />
  </VereinsheimZeitung>
</template>
