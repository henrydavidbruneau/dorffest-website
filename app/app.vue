<script setup lang="ts">
useHead({
  // früh setzen, damit Einblend-Animationen ihren Startzustand nur mit JavaScript bekommen
  script: [{ innerHTML: 'document.documentElement.classList.add(\'js\')', tagPosition: 'head' }],
  titleTemplate: (titel?: string) =>
    titel ? `${titel} · Königsdorf rückt zusammen` : 'Königsdorf rückt zusammen',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
