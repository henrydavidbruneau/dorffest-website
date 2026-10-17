<script setup lang="ts">
// Rubrik-Kopf: dicke Linie, Titel, Handschrift rechts, dünne Linie
defineProps<{
  titel: string
  zusatz?: string
  id?: string
}>()
</script>

<template>
  <div class="rubrik">
    <h2 :id="id" class="rubrik__titel">{{ titel }}</h2>
    <p v-if="zusatz" class="rubrik__zusatz handschrift">{{ zusatz }}</p>
  </div>
</template>

<style scoped>
.rubrik {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--abstand-s);
  padding-block: 0.65rem 0.4rem;
  border-top: 4px solid var(--farbe-schwarz);
  border-bottom: 1.5px solid var(--farbe-schwarz);
}

.rubrik__titel {
  font-size: clamp(1.375rem, 1.94vw, 1.75rem);
  line-height: 1;
  color: var(--farbe-schwarz);
}

.rubrik__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange-text);
}
</style>
