<script setup lang="ts">
// Grundwerte fürs Teilen (WhatsApp, Signal …) und für Suchmaschinen; Seiten überschreiben sie
const route = useRoute()
const url = useRequestURL()
const kanonisch = computed(() => `${url.origin}${route.path === '/' ? '/' : route.path.replace(/\/$/, '')}`)

useSeoMeta({
  ogSiteName: 'Königsdorf rückt zusammen',
  ogLocale: 'de_DE',
  ogType: 'website',
  ogUrl: kanonisch,
  ogImage: `${url.origin}/vorschau.png`,
  ogImageType: 'image/png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Königsdorf rückt zusammen – Verein für Zusammenhalt',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: kanonisch }],
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
