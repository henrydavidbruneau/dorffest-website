<script setup lang="ts">
// Runder roter Sticker mit Zahl („3 neu“) – nur sichtbar, wenn es etwas Neues gibt
defineProps<{ anzahl: number, text?: string }>()
</script>

<template>
  <span v-if="anzahl > 0" class="sticker">
    <span class="sticker__zahl">{{ anzahl }}</span>
    <span class="sticker__text">{{ text ?? 'neu' }}</span>
  </span>
</template>

<style scoped>
.sticker {
  position: absolute;
  top: -0.9rem;
  right: -0.7rem;
  z-index: 2;
  display: grid;
  place-content: center;
  width: 3.6rem;
  height: 3.6rem;
  border: 2px solid var(--farbe-schwarz);
  border-radius: 50%;
  background: #d8342a;
  color: var(--farbe-weiss);
  text-align: center;
  line-height: 0.95;
  box-shadow: 2px 3px 0 rgb(0 0 0 / 0.3);
  rotate: 12deg;
}

.sticker__zahl {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.35rem;
}

.sticker__text {
  font-size: 0.7rem;
  font-weight: var(--gewicht-text-fett);
  text-transform: uppercase;
}
</style>
