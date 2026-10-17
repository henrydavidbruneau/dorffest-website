<script setup lang="ts">
// Farbiger Kasten hinter einzelnen Wörtern, z.B. "RÜCKT ZUSAMMEN", "DORF!"
withDefaults(
  defineProps<{
    /** Drehung in Grad, z.B. -2 */
    drehung?: number
    farbe?: 'flieder' | 'lila' | 'orange'
  }>(),
  { drehung: -1.5, farbe: 'flieder' },
)
</script>

<template>
  <span
    class="hervorhebung"
    :class="`hervorhebung--${farbe}`"
    :style="{ '--drehung': `${drehung}deg` }"
  ><slot /></span>
</template>

<style scoped>
.hervorhebung {
  display: inline-block;
  padding: 0.04em 0.16em 0;
  border-radius: var(--radius-m);
  color: var(--farbe-weiss);
  transform: rotate(var(--drehung));
}

.hervorhebung--flieder {
  background: var(--farbe-flieder);
}

.hervorhebung--lila {
  background: var(--farbe-lila);
}

.hervorhebung--orange {
  background: var(--farbe-orange);
  color: var(--farbe-schwarz);
}
</style>
