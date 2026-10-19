<script setup lang="ts">
// Cloudflare Turnstile (Bot-Schutz). Ohne Site-Key (lokal, Deploy-Preview) wird nichts angezeigt –
// dann prüft auch der Server nicht. Das Token landet per v-model im Formular (Feld `turnstile`).
const token = defineModel<string>({ default: '' })

const { turnstileSiteKey } = useRuntimeConfig().public
const box = ref<HTMLElement>()
let widgetId: string | undefined

onMounted(async () => {
  if (!turnstileSiteKey || !box.value) return
  const turnstile = await ladeTurnstile()
  if (!box.value) return
  widgetId = turnstile.render(box.value, {
    'sitekey': turnstileSiteKey,
    // das normale Kästchen ist fest 300px breit – in schmalen Spalten (z.B. Leserbrief-Zettel) die kompakte Form
    'size': box.value.clientWidth < 300 ? 'compact' : 'normal',
    'language': 'de',
    'appearance': 'interaction-only',
    'callback': (t: string) => (token.value = t),
    'expired-callback': () => (token.value = ''),
    'error-callback': () => (token.value = ''),
  })
  registriereTurnstile(widgetId, () => (token.value = ''))
})

onBeforeUnmount(() => {
  if (widgetId) entferneTurnstile(widgetId)
})
</script>

<template>
  <div v-if="turnstileSiteKey" ref="box" class="turnstile" />
</template>

<style scoped>
.turnstile {
  max-width: 100%;
}

.turnstile:empty {
  display: none;
}
</style>
