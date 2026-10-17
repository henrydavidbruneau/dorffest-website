<script setup lang="ts">
// Dekoratives Tape-Stück am oberen Rand eines Zettels (Elternelement braucht position: relative)
withDefaults(
  defineProps<{
    position?: 'links' | 'mitte' | 'rechts'
    farbe?: 'gelb' | 'flieder' | 'pfirsich'
    drehung?: number
    /** Breite in rem */
    breite?: number
  }>(),
  { position: 'mitte', farbe: 'gelb', drehung: -3, breite: 5 },
)
</script>

<template>
  <span
    class="klebeband"
    :class="[`klebeband--${position}`, `klebeband--${farbe}`]"
    :style="{ '--drehung': `${drehung}deg`, '--breite': `${breite}rem` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.klebeband {
  position: absolute;
  top: -0.7rem;
  z-index: 1;
  width: var(--breite);
  height: 1.4rem;
  opacity: 0.85;
  transform: translateX(var(--versatz, 0)) rotate(var(--drehung));
  pointer-events: none;
}

.klebeband--links {
  left: 1.25rem;
}

.klebeband--mitte {
  left: 50%;
  --versatz: -50%;
}

.klebeband--rechts {
  right: 1.25rem;
}

.klebeband--gelb {
  background: var(--farbe-gelb);
}

.klebeband--flieder {
  background: color-mix(in srgb, var(--farbe-flieder) 75%, var(--farbe-weiss));
}

.klebeband--pfirsich {
  background: var(--farbe-pfirsich);
}
</style>
