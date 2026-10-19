<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Über uns · Vereinsheim', robots: 'noindex, nofollow' })
const reiter = ref('stimmen')
</script>

<template>
  <div class="ueber">
    <VereinsheimKopf titel="Über uns" zusatz="Stimmen aus dem Verein & Fragen auf der Startseite">
      <BasisKnopf v-if="reiter === 'stimmen'" to="/vereinsheim/ueber-uns/stimme/neu">+ Neue Stimme</BasisKnopf>
      <BasisKnopf v-else to="/vereinsheim/ueber-uns/frage/neu">+ Neue Frage</BasisKnopf>
    </VereinsheimKopf>
    <VereinsheimReiter v-model="reiter" :reiter="[{ key: 'stimmen', text: 'Stimmen' }, { key: 'fragen', text: 'Fragen (FAQ)' }]" />
    <VereinsheimSortierListe v-if="reiter === 'stimmen'" collection="stimmen" titel-feld="name" unter-feld="zitat" basis="/vereinsheim/ueber-uns/stimme" leer="Noch keine Stimmen. Wer sagt was Schönes?" />
    <VereinsheimSortierListe v-else collection="faq" titel-feld="frage" unter-feld="antwort" basis="/vereinsheim/ueber-uns/frage" leer="Keine Fragen. Alles klar?" />
  </div>
</template>

<style scoped>
.ueber {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}
</style>
