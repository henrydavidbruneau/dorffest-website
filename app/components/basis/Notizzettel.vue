<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: string
    farbe?: 'weiss' | 'creme' | 'pfirsich' | 'gelb' | 'papier'
    /** Drehung in Grad */
    drehung?: number
    /** Tape oben; false = ohne */
    tape?: false | 'links' | 'mitte' | 'rechts'
    tapeFarbe?: 'gelb' | 'flieder' | 'pfirsich'
    tapeDrehung?: number
    /** statt Tape: Pinnnadel oder Foldback-Klammer oben */
    befestigung?: false | 'pin' | 'klammer'
    /** Rahmen: dünn schwarz oder orange (Was wir tun) */
    rahmen?: false | 'schwarz' | 'orange'
    /** Eckenradius */
    radius?: 's' | 'l' | 'xl'
  }>(),
  {
    as: 'div',
    farbe: 'weiss',
    drehung: 0,
    tape: false,
    tapeFarbe: 'gelb',
    tapeDrehung: -2,
    befestigung: false,
    rahmen: false,
    radius: 's',
  },
)
</script>

<template>
  <component
    :is="as"
    class="notizzettel"
    :class="[`notizzettel--${farbe}`, `notizzettel--radius-${radius}`, rahmen && `notizzettel--rahmen-${rahmen}`]"
    :style="{ '--drehung': `${drehung}deg` }"
  >
    <BasisKlebeband v-if="tape" :position="tape" :farbe="tapeFarbe" :drehung="tapeDrehung" />
    <span v-if="befestigung === 'pin'" class="notizzettel__pin" aria-hidden="true" />
    <svg
      v-if="befestigung === 'klammer'"
      class="notizzettel__klammer"
      viewBox="0 0 64 70"
      aria-hidden="true"
    >
      <!-- Foldback-Klammer: Bügel + schwarzer Klemmkörper -->
      <path d="M22 44 V12 a10 10 0 0 1 20 0 V44" fill="none" stroke="#9a9a9a" stroke-width="3" />
      <path d="M26 44 V16 a6 6 0 0 1 12 0 V44" fill="none" stroke="#d9d9d9" stroke-width="2" />
      <path d="M4 40 h56 l-4 26 h-48 z" fill="#1d1d1d" />
      <path d="M8 44 h48" stroke="#4a4a4a" stroke-width="2" />
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

.notizzettel--papier {
  background: var(--farbe-notizpapier);
}

.notizzettel--radius-s {
  border-radius: var(--radius-s);
}

.notizzettel--radius-l {
  border-radius: var(--radius-l);
}

.notizzettel--radius-xl {
  border-radius: var(--radius-xl);
}

.notizzettel--rahmen-schwarz {
  border: 1px solid var(--farbe-schwarz);
}

.notizzettel--rahmen-orange {
  border: 2px solid var(--farbe-orange);
  box-shadow: none;
}

.notizzettel__pin {
  position: absolute;
  top: 1.1rem;
  left: 50%;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--farbe-lila);
  box-shadow: 1px 4px 0 rgb(0 0 0 / 0.25);
  transform: translateX(-50%);
}

.notizzettel__klammer {
  position: absolute;
  top: -2.6rem;
  left: 50%;
  width: 4rem;
  height: auto;
  transform: translateX(-50%) rotate(2deg);
}
</style>
