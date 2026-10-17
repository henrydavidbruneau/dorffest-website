<script setup lang="ts">
useHead({
  titleTemplate: (titel?: string) =>
    titel ? `${titel} · Königsdorf rückt zusammen` : 'Königsdorf rückt zusammen',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
