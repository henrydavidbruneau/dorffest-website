<script setup lang="ts">
// Seiten mit lila Kopfbereich bekommen die Navigation im lila Farbschema
const route = useRoute()
const dunkel = computed(() => route.path.startsWith('/termine/'))
</script>

<template>
  <div class="seite">
    <LayoutKopf :dunkel="dunkel" />
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
