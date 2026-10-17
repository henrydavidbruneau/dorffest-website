<script setup lang="ts">
withDefaults(
  defineProps<{
    farbe?: 'orange' | 'lila' | 'schwarz' | 'pfirsich'
    /** Dicke in px */
    dicke?: number
  }>(),
  { farbe: 'orange', dicke: 3 },
)
</script>

<template>
  <hr
    class="trennlinie strich-oben"
    :style="{ '--strichfarbe': `var(--farbe-${farbe})`, '--strich-dicke': `${dicke}px` }"
  >
</template>

<style scoped>
.trennlinie {
  width: 100%;
  height: var(--strich-dicke);
  margin: 0;
  border: 0;
}
</style>
