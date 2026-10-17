<script setup lang="ts">
withDefaults(
  defineProps<{
    art?: 'gepunktet' | 'gestrichelt'
    farbe?: 'orange' | 'lila' | 'schwarz' | 'pfirsich'
  }>(),
  { art: 'gepunktet', farbe: 'orange' },
)
</script>

<template>
  <hr class="trennlinie" :class="[`trennlinie--${art}`, `trennlinie--${farbe}`]">
</template>

<style scoped>
.trennlinie {
  width: 100%;
  margin: 0;
  border: 0;
  border-top-width: 3px;
  border-top-color: var(--linienfarbe);
}

.trennlinie--gepunktet {
  border-top-style: dotted;
}

.trennlinie--gestrichelt {
  border-top-width: 1.5px;
  border-top-style: dashed;
}

.trennlinie--orange {
  --linienfarbe: var(--farbe-orange);
}

.trennlinie--lila {
  --linienfarbe: var(--farbe-lila);
}

.trennlinie--schwarz {
  --linienfarbe: var(--farbe-schwarz);
}

.trennlinie--pfirsich {
  --linienfarbe: var(--farbe-pfirsich);
}
</style>
