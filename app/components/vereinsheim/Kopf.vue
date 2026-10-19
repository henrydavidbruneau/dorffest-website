<script setup lang="ts">
// Seitenüberschrift im Vereinsheim: Papierstreifen mit Tape, darunter optional ein Satz
defineProps<{ titel: string, zusatz?: string }>()
</script>

<template>
  <header class="vh-kopf">
    <div class="vh-kopf__streifen">
      <BasisKlebeband position="links" farbe="flieder" :drehung="-6" :breite="3.5" />
      <h1 class="vh-kopf__titel">{{ titel }}</h1>
    </div>
    <p v-if="zusatz" class="vh-kopf__zusatz handschrift">{{ zusatz }}</p>
    <div v-if="$slots.default" class="vh-kopf__aktionen"><slot /></div>
  </header>
</template>

<style scoped>
.vh-kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-xs) var(--abstand-m);
  max-width: var(--inhaltsbreite);
  margin: 0 auto var(--abstand-l);
}

.vh-kopf__streifen {
  position: relative;
  padding: 0.6rem 1.4rem 0.4rem;
  background: var(--farbe-creme);
  box-shadow: var(--schatten-zettel);
  rotate: -1deg;
}

.vh-kopf__titel {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  line-height: 1;
  color: var(--farbe-lila);
}

.vh-kopf__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-schwarz);
}

.vh-kopf__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-left: auto;
}
</style>
