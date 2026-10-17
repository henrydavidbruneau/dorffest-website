<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string
    alt: string
    /** Bildmaße in px (für Seitenverhältnis und @nuxt/image) */
    breite: number
    hoehe: number
    /** Handschriftliche Unterschrift */
    unterschrift?: string
    drehung?: number
    tape?: false | 'links' | 'mitte' | 'rechts'
    tapeFarbe?: 'gelb' | 'flieder' | 'pfirsich'
  }>(),
  { unterschrift: undefined, drehung: -3, tape: 'mitte', tapeFarbe: 'gelb' },
)
</script>

<template>
  <figure class="polaroid" :style="{ '--drehung': `${drehung}deg` }">
    <BasisKlebeband v-if="tape" :position="tape" :farbe="tapeFarbe" />
    <NuxtImg :src="src" :alt="alt" :width="breite" :height="hoehe" class="polaroid__bild" />
    <figcaption v-if="unterschrift" class="polaroid__unterschrift handschrift">
      {{ unterschrift }}
    </figcaption>
  </figure>
</template>

<style scoped>
.polaroid {
  position: relative;
  margin: 0;
  padding: 0.75rem 0.75rem 0.5rem;
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
  transform: rotate(var(--drehung));
}

.polaroid__bild {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.polaroid__unterschrift {
  min-height: 2.2rem;
  padding-top: 0.5rem;
  text-align: center;
}
</style>
