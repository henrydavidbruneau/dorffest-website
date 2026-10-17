<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: string
    farbe?: 'weiss' | 'creme' | 'pfirsich' | 'gelb'
    /** Drehung in Grad */
    drehung?: number
    /** Tape oben; false = ohne */
    tape?: false | 'links' | 'mitte' | 'rechts'
    tapeFarbe?: 'gelb' | 'flieder' | 'pfirsich'
    tapeDrehung?: number
    /** dünner dunkler Rahmen */
    rahmen?: boolean
  }>(),
  {
    as: 'div',
    farbe: 'weiss',
    drehung: 0,
    tape: false,
    tapeFarbe: 'gelb',
    tapeDrehung: -3,
    rahmen: false,
  },
)
</script>

<template>
  <component
    :is="as"
    class="notizzettel"
    :class="[`notizzettel--${farbe}`, { 'notizzettel--rahmen': rahmen }]"
    :style="{ '--drehung': `${drehung}deg` }"
  >
    <BasisKlebeband v-if="tape" :position="tape" :farbe="tapeFarbe" :drehung="tapeDrehung" />
    <slot />
  </component>
</template>

<style scoped>
.notizzettel {
  position: relative;
  padding: var(--abstand-m);
  box-shadow: var(--schatten-zettel);
  transform: rotate(var(--drehung));
}

.notizzettel--weiss {
  background: var(--farbe-weiss);
}

.notizzettel--creme {
  background: var(--farbe-creme);
}

.notizzettel--pfirsich {
  background: var(--farbe-pfirsich);
}

.notizzettel--gelb {
  background: var(--farbe-gelb);
}

.notizzettel--rahmen {
  border: 1px solid var(--farbe-schwarz);
}
</style>
