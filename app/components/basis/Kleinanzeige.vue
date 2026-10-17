<script setup lang="ts">
const props = defineProps<{
  anzeige: Kleinanzeige
  ebene?: 2 | 3 | 4
}>()

const ART: Record<KleinanzeigeArt, string> = {
  gesucht: 'Gesucht',
  biete: 'Biete',
  gefunden: 'Gefunden',
}

const tag = computed(() => `h${props.ebene ?? 3}`)
</script>

<template>
  <article class="kleinanzeige">
    <component :is="tag" class="kleinanzeige__titel">{{ ART[anzeige.art] }}: {{ anzeige.titel }}</component>
    <p class="kleinanzeige__text">{{ anzeige.text }}</p>
    <a v-if="anzeige.link" :href="anzeige.link" class="kleinanzeige__link handschrift">
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
