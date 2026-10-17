<script setup lang="ts">
// Farbiger Kasten hinter einzelnen Wörtern, z.B. "RÜCKT ZUSAMMEN", "DORF!".
// Ecken wie im Design: klein gerundet, unten rechts stark gerundet.
withDefaults(
  defineProps<{
    /** Drehung in Grad, z.B. -1 */
    drehung?: number
    farbe?: 'flieder' | 'lila' | 'orange'
  }>(),
  { drehung: 0, farbe: 'flieder' },
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
  padding: 0.14em 0.2em 0.12em;
  border-radius: 0.12em 0.12em 0.42em 0.12em;
  line-height: var(--zeilenhoehe-display);
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
