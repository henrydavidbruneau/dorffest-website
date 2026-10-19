<script setup lang="ts">
// Unter-Reiter einer Vereinsheim-Seite (z.B. Artikel · Kleinanzeigen · …); merkt sich den Reiter in der Adresse (?reiter=)
const props = defineProps<{
  reiter: { key: string, text: string, anzahl?: number }[]
  /** zeitung = wie der Ressort-Filter im Dorfanzeiger */
  stil?: 'knoepfe' | 'zeitung'
}>()
const route = useRoute()
const aktiv = defineModel<string>({ required: true })

onMounted(() => {
  const ausAdresse = String(route.query.reiter ?? '')
  if (props.reiter.some(r => r.key === ausAdresse)) aktiv.value = ausAdresse
})
watch(aktiv, key => navigateTo({ query: { ...route.query, reiter: key } }, { replace: true }))
</script>

<template>
  <div class="unterreiter" :class="{ 'unterreiter--zeitung': stil === 'zeitung' }" role="tablist">
    <button
      v-for="r in reiter"
      :key="r.key"
      type="button"
      role="tab"
      :aria-selected="aktiv === r.key"
      class="unterreiter__knopf"
      @click="aktiv = r.key"
    >
      {{ r.text }}<span v-if="r.anzahl" class="unterreiter__zahl">{{ r.anzahl }}</span>
    </button>
  </div>
</template>

<style scoped>
.unterreiter {
  display: flex;
  overflow-x: auto;
  gap: 0.25rem;
  width: fit-content;
  max-width: var(--inhaltsbreite);
  margin: 0 0 var(--abstand-l);
  padding: 0.25rem;
  border: 1px solid var(--vh-rand, #e4dccf);
  border-radius: 999px;
  background: var(--farbe-weiss);
}

.unterreiter__knopf {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border: 0;
  border-radius: 999px;
  background: none;
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: var(--groesse-xs);
  white-space: nowrap;
  cursor: pointer;
}

.unterreiter__knopf:hover {
  background: var(--farbe-pfirsich);
}

.unterreiter__knopf[aria-selected='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.unterreiter__zahl {
  display: inline-grid;
  place-items: center;
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--farbe-orange);
  color: var(--farbe-schwarz);
  font-size: 0.75rem;
  font-weight: var(--gewicht-text-fett);
}

.unterreiter--zeitung {
  flex-wrap: wrap;
  justify-content: center;
  width: auto;
  border: 0;
  border-radius: 0;
  background: none;
  gap: 0.25rem clamp(1rem, 2.2vw, 2rem);
  margin: 0;
  padding: 0.8rem 0 0.5rem;
}

.unterreiter--zeitung .unterreiter__knopf {
  padding: 0 0 0.2rem;
  border: 0;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  background: none;
  box-shadow: none;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1rem, 1.39vw, 1.25rem);
  text-transform: uppercase;
}

.unterreiter--zeitung .unterreiter__knopf:hover {
  background: none;
}

.unterreiter--zeitung .unterreiter__knopf[aria-selected='true'] {
  background: none;
  border-bottom-color: var(--farbe-orange);
  color: var(--farbe-lila);
}
</style>
