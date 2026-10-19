<script setup lang="ts">
// Status als Stempel (leicht schief, Tinte in der Farbe des Status)
const props = defineProps<{ status: string | null | undefined }>()

const STEMPEL: Record<string, { text: string, farbe: string }> = {
  published: { text: 'am Brett', farbe: '#1f7a3a' },
  draft: { text: 'Entwurf', farbe: '#6b6b6b' },
  archived: { text: 'Archiv', farbe: '#6b6b6b' },
  hidden: { text: 'ausgeblendet', farbe: '#a1260d' },
  angemeldet: { text: 'angemeldet', farbe: '#1f7a3a' },
  abgemeldet: { text: 'abgemeldet', farbe: '#a1260d' },
  eingereicht: { text: 'eingereicht', farbe: '#a45c08' },
  angenommen: { text: 'angenommen', farbe: '#1f7a3a' },
  abgelehnt: { text: 'abgelehnt', farbe: '#a1260d' },
  genehmigt: { text: 'genehmigt', farbe: '#1f5f9a' },
  ausgezahlt: { text: 'ausgezahlt', farbe: '#1f7a3a' },
  offen: { text: 'offen', farbe: '#1f5f9a' },
  widerrufen: { text: 'widerrufen', farbe: '#a1260d' },
  neu: { text: 'neu', farbe: '#a45c08' },
  in_planung: { text: 'in Planung', farbe: '#1f5f9a' },
  umgesetzt: { text: 'umgesetzt', farbe: '#1f7a3a' },
  aktiv: { text: 'aktiv', farbe: '#1f7a3a' },
  ausgetreten: { text: 'ausgetreten', farbe: '#6b6b6b' },
  gestrichen: { text: 'gestrichen', farbe: '#a1260d' },
}

const stempel = computed(() => STEMPEL[props.status ?? ''] ?? { text: props.status ?? '–', farbe: '#6b6b6b' })
</script>

<template>
  <span class="stempel" :style="{ '--tinte': stempel.farbe }">{{ stempel.text }}</span>
</template>

<style scoped>
.stempel {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border: 2px solid var(--tinte);
  border-radius: 0.3rem;
  color: var(--tinte);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  rotate: -4deg;
  opacity: 0.9;
}
</style>
