<script setup lang="ts">
const props = defineProps<{
  anzeige: Kleinanzeige
  ebene?: 2 | 3 | 4
}>()

const tag = computed(() => `h${props.ebene ?? 3}`)
// Antwort per Mail, Betreff „Kleinanzeige: …“
const link = computed(() => props.anzeige.ziel_email
  ? `mailto:${props.anzeige.ziel_email}?subject=${encodeURIComponent(`Kleinanzeige: ${props.anzeige.ueberschrift}`)}`
  : null)
</script>

<template>
  <article class="kleinanzeige">
    <component :is="tag" class="kleinanzeige__titel">{{ anzeige.ueberschrift }}</component>
    <p v-if="anzeige.kurzbeschreibung" class="kleinanzeige__text">{{ anzeige.kurzbeschreibung }}</p>
    <a v-if="link" :href="link" class="kleinanzeige__link handschrift">
      → {{ anzeige.link_text ?? 'melde dich!' }}
    </a>
  </article>
</template>

<style scoped>
.kleinanzeige {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-3xs);
  padding: var(--abstand-xs);
  border: 1.5px solid var(--farbe-schwarz);
  background: var(--farbe-creme);
}

.kleinanzeige__titel {
  font-size: var(--groesse-m);
  line-height: 1.1;
  color: var(--farbe-schwarz);
}

.kleinanzeige__text {
  margin: 0;
  font-size: var(--groesse-xs);
  line-height: 1.4;
}

.kleinanzeige__link {
  font-size: 1.3em;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.kleinanzeige__link:hover {
  text-decoration: underline;
}
</style>
