<script setup lang="ts">
// Runder Knopf nur mit Symbol (z.B. über einer Mail), Beschriftung als Tooltip bei Hover/Fokus
// und für Screenreader. `tipp` ist Pflicht – ohne Text kein Knopf.
defineProps<{
  symbol: 'loeschen' | 'antworten' | 'alle' | 'weiterleiten' | 'markieren' | 'mehr'
  tipp: string
  disabled?: boolean
  /** Tooltip rechtsbündig (für Knöpfe am rechten Rand) */
  rechts?: boolean
}>()
</script>

<template>
  <button type="button" class="symbol" :class="{ 'symbol--rechts': rechts }" :aria-label="tipp" :data-tipp="tipp" :disabled="disabled">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <template v-if="symbol === 'loeschen'">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
      </template>
      <template v-else-if="symbol === 'antworten'">
        <path d="M10 8 5 12.5l5 4.5" />
        <path d="M5 12.5h9a5 5 0 0 1 5 5V19" />
      </template>
      <template v-else-if="symbol === 'alle'">
        <path d="M9 8 4 12.5 9 17" />
        <path d="M13 8l-5 4.5 5 4.5" />
        <path d="M8 12.5h7a5 5 0 0 1 5 5V19" />
      </template>
      <template v-else-if="symbol === 'weiterleiten'">
        <path d="M14 8l5 4.5-5 4.5" />
        <path d="M19 12.5h-9a5 5 0 0 0-5 5V19" />
      </template>
      <template v-else-if="symbol === 'markieren'">
        <path d="M9 4h6l-1 5 3 3H7l3-3z" />
        <path d="M12 12v8" />
      </template>
      <template v-else>
        <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
      </template>
    </svg>
  </button>
</template>

<style scoped>
.symbol {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--farbe-lila);
  cursor: pointer;
}

.symbol svg {
  width: 1.4rem;
  height: 1.4rem;
}

.symbol:hover:not(:disabled),
.symbol[aria-expanded='true'] {
  background: var(--farbe-pfirsich);
}

.symbol:disabled {
  opacity: 0.45;
  cursor: default;
}

/* Tooltip */
.symbol::after {
  content: attr(data-tipp);
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 50%;
  z-index: 20;
  padding: 0.3rem 0.55rem;
  border-radius: 0.4rem;
  background: var(--farbe-schwarz);
  color: var(--farbe-weiss);
  font-family: var(--schrift-text);
  font-size: var(--groesse-xs);
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%);
  transition: opacity 0.15s 0.3s;
}

.symbol--rechts::after {
  left: auto;
  right: 0;
  transform: none;
}

.symbol:hover::after,
.symbol:focus-visible::after {
  opacity: 1;
}

.symbol[aria-expanded='true']::after {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .symbol::after {
    transition: none;
  }
}
</style>
