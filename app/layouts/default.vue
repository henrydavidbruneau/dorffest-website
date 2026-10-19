<script setup lang="ts">
// Seiten mit lila Kopfbereich bekommen die Navigation im lila Farbschema
const route = useRoute()
// lila Navigation über lila Kopfband (Terminseiten, Newsletter-Danke)
const dunkel = computed(() => route.path.startsWith('/termine/') || route.path.startsWith('/newsletter/'))
// Startseite: Navigation fährt beim ersten Laden von oben herein (Teil der Aufbau-Animation)
const nuxtApp = useNuxtApp()
const einfahren = route.path === '/' && (import.meta.server || nuxtApp.isHydrating)
</script>

<template>
  <div class="seite">
    <LayoutKopf :dunkel="dunkel" :einfahren="einfahren" />
    <main id="inhalt" tabindex="-1">
      <slot />
    </main>
    <LayoutFuss />
  </div>
</template>

<style scoped>
.seite {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

main:focus {
  outline: none;
}
</style>
