<!-- Layout für den Dorfanzeiger: Zeitungsblatt auf lila Grund,
     Navigation im lila Farbschema (fährt beim direkten Aufruf herein) und normaler Fuß. -->
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
    <LayoutFuss class="zeitung-layout__fuss" />
  </div>
</template>

<style scoped>
.zeitung-layout {
  --farbe-fokus: var(--farbe-gelb);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--farbe-lila);
  overflow-x: clip;
}

main {
  flex: 1;
  padding-bottom: clamp(3rem, 8vw, 8rem);
}

/* Fuß auf Pfirsich: Fokusrahmen wieder lila */
.zeitung-layout__fuss {
  --farbe-fokus: var(--farbe-lila);
}

main:focus {
  outline: none;
}
</style>
