<!-- Layout für den Dorfanzeiger: Zeitungsblatt auf lila Grund.
     Testweise mit der normalen Navigation, die von oben hereinfährt und mitscrollt. -->
<script setup lang="ts">
// Navigation fährt nur beim direkten Aufruf herein; bei Navigation innerhalb der Seite bleibt sie stehen
const nuxtApp = useNuxtApp()
const einfahren = import.meta.server || nuxtApp.isHydrating
</script>

<template>
  <div class="zeitung-layout">
    <LayoutKopf :einfahren="einfahren" dunkel />
    <main id="inhalt" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.zeitung-layout {
  --farbe-fokus: var(--farbe-gelb);
  min-height: 100vh;
  padding-bottom: clamp(3rem, 8vw, 8rem);
  background: var(--farbe-lila);
  overflow-x: clip;
}

main:focus {
  outline: none;
}
</style>
