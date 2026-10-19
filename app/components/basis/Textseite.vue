<script setup lang="ts">
// Einfache Textseite (Satzung, Impressum, Datenschutz). Inhalt als Markdown aus app/inhalte/.
import { marked } from 'marked'

const props = defineProps<{
  zusatz?: string
  titel: string
  /** Markdown (vertrauenswürdig, aus dem Repo) */
  inhalt: string
}>()

// Londrina Solid hat kein sichtbares "§" – in Überschriften (auch mitten im Text) darum in Poppins setzen
const html = computed(() =>
  (marked.parse(props.inhalt, { async: false }) as string)
    .replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/g, (_, h, attr, text) =>
      `<${h}${attr}>${text.replace(/§\s*/g, '<span class="paragraf">§</span>&nbsp;')}</${h}>`),
)
</script>

<template>
  <article class="textseite inhalt">
    <header class="textseite__kopf">
      <p v-if="zusatz" class="textseite__zusatz handschrift">{{ zusatz }}</p>
      <h1 class="textseite__titel">{{ titel }}</h1>
    </header>
    <slot />
    <!-- eslint-disable-next-line vue/no-v-html -- Inhalt stammt aus Dateien im Repo -->
    <div class="textseite__text" v-html="html" />
  </article>
</template>

<style scoped>
.textseite {
  padding-block: clamp(2.5rem, 5vw, 4.5rem) var(--abstand-sektion);
}

.textseite__zusatz {
  margin: 0;
  color: var(--farbe-orange);
}

.textseite__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h2);
  overflow-wrap: anywhere;
}

.textseite__text {
  max-width: 44rem;
  margin-top: var(--abstand-l);
  font-size: var(--groesse-m);
  line-height: 1.7;
}

.textseite__text :deep(h2) {
  margin: 2.2em 0 0.6em;
  padding-top: 0.9rem;
  font-size: var(--groesse-h3);
  background-image: repeating-linear-gradient(90deg, var(--farbe-orange) 0 6px, transparent 6px 10px);
  background-repeat: no-repeat;
  background-size: 100% 3px;
}

.textseite__text :deep(.paragraf) {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-fett);
}

.textseite__text :deep(h2:first-child) {
  margin-top: 0;
}

.textseite__text :deep(p),
.textseite__text :deep(ul),
.textseite__text :deep(ol) {
  margin: 0 0 1em;
}

.textseite__text :deep(ol),
.textseite__text :deep(ul) {
  padding-left: 1.4em;
}

.textseite__text :deep(li) {
  margin-bottom: 0.4em;
}

.textseite__text :deep(li::marker) {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  color: var(--farbe-orange-text);
}

.textseite__text :deep(strong) {
  font-weight: var(--gewicht-text-fett);
}

.textseite__text :deep(a) {
  color: var(--farbe-lila);
  overflow-wrap: anywhere;
}
</style>
