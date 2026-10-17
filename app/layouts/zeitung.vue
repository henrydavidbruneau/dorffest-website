<!-- Layout für den Dorfanzeiger: Zeitungsblatt auf lila Grund.
     Testweise mit der normalen Navigation, die von oben hereinfährt und mitscrollt. -->
<script setup lang="ts">
const einfahren = useZeitungAnimation()
</script>

<template>
  <div class="zeitung-layout">
    <LayoutKopf :einfahren="einfahren" />
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

/* Fokus innerhalb der (cremefarbenen) Navigation wieder lila */
.zeitung-layout :deep(.kopf:not(.kopf--gescrollt)) {
  --farbe-fokus: var(--farbe-lila);
}

main:focus {
  outline: none;
}
</style>
