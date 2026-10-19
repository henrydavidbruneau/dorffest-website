<script setup lang="ts">
// Seitenüberschrift im Vereinsheim, wie auf der Website: Handschrift-Zeile, große Display-Überschrift
defineProps<{ titel: string, zusatz?: string }>()
</script>

<template>
  <header class="vh-kopf">
    <div>
      <p v-if="zusatz" class="vh-kopf__zusatz handschrift">{{ zusatz }}</p>
      <h1 class="vh-kopf__titel">{{ titel }}</h1>
    </div>
    <div v-if="$slots.default" class="vh-kopf__aktionen"><slot /></div>
  </header>
</template>

<style scoped>
.vh-kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--abstand-s) var(--abstand-m);
  max-width: var(--inhaltsbreite);
  margin: 0 auto var(--abstand-l);
  padding-bottom: var(--abstand-m);
  border-bottom: var(--strich-dicke) dashed var(--farbe-orange);
}

.vh-kopf__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
  rotate: -2deg;
}

.vh-kopf__titel {
  margin: 0;
  font-size: var(--groesse-h2-klein);
  line-height: var(--zeilenhoehe-display);
  color: var(--farbe-lila);
}

.vh-kopf__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-left: auto;
}
</style>
