<script setup lang="ts">
// Unter-Reiter einer Vereinsheim-Seite (z.B. Artikel · Kleinanzeigen · …); merkt sich den Reiter in der Adresse (?reiter=)
const props = defineProps<{ reiter: { key: string, text: string, anzahl?: number }[] }>()
const route = useRoute()
const aktiv = defineModel<string>({ required: true })

onMounted(() => {
  const ausAdresse = String(route.query.reiter ?? '')
  if (props.reiter.some(r => r.key === ausAdresse)) aktiv.value = ausAdresse
})
watch(aktiv, key => navigateTo({ query: { ...route.query, reiter: key } }, { replace: true }))
</script>

<template>
  <div class="unterreiter" role="tablist">
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
  flex-wrap: wrap;
  gap: var(--abstand-2xs);
  max-width: var(--inhaltsbreite);
  margin: 0 auto var(--abstand-l);
}

.unterreiter__knopf {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border: 2px solid var(--farbe-schwarz);
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1rem;
  text-transform: uppercase;
  box-shadow: 2px 2px 0 rgb(0 0 0 / 0.3);
  cursor: pointer;
}

.unterreiter__knopf[aria-selected='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.unterreiter__zahl {
  display: inline-grid;
  place-items: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #d8342a;
  color: var(--farbe-weiss);
  font-size: 0.8rem;
}
</style>
