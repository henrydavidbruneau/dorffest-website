<script setup lang="ts">
// Status als ruhiges Etikett mit Farbpunkt (gerade, gut lesbar)
const props = defineProps<{ status: string | null | undefined }>()

const STEMPEL: Record<string, { text: string, farbe: string }> = {
  published: { text: 'Veröffentlicht', farbe: '#1f7a3a' },
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
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.65rem 0.2rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tinte) 10%, white);
  color: var(--tinte);
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: nowrap;
}

.stempel::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: currentColor;
}
</style>
