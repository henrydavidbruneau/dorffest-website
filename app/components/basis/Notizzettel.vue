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
    /** statt Tape: Pinnnadel oder Büroklammer oben */
    befestigung?: false | 'pin' | 'klammer'
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
    befestigung: false,
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
    <span v-if="befestigung === 'pin'" class="notizzettel__pin" aria-hidden="true" />
    <svg
      v-if="befestigung === 'klammer'"
      class="notizzettel__klammer"
      viewBox="0 0 24 64"
      aria-hidden="true"
    >
      <path d="M8 22V8a4 4 0 0 1 8 0v40a7 7 0 0 1-14 0V14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    </svg>
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

.notizzettel__pin {
  position: absolute;
  top: 0.6rem;
  left: 50%;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--farbe-flieder) 60%, white), var(--farbe-lila));
  box-shadow: 1px 3px 4px rgb(0 0 0 / 0.35);
  transform: translateX(-50%);
}

.notizzettel__klammer {
  position: absolute;
  top: -1.6rem;
  left: 1.5rem;
  width: 1.4rem;
  height: auto;
  color: #555;
  transform: rotate(8deg);
}

.notizzettel--rahmen {
  border: 1px solid var(--farbe-schwarz);
}
</style>
