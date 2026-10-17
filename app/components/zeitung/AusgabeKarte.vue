<script setup lang="ts">
const props = defineProps<{ ausgabe: Ausgabe }>()

const titel = computed(() => `Nr. ${props.ausgabe.nummer}`)
const erschienen = computed(() => !!props.ausgabe.erschienen_am)
</script>

<template>
  <article class="ausgabe" :class="{ 'ausgabe--geplant': !erschienen }">
    <template v-if="erschienen">
      <h3 class="ausgabe__titel">{{ titel }} · {{ JAHRESZEITEN[ausgabe.jahreszeit] }}</h3>
      <NuxtImg
        v-if="ausgabe.bild"
        :src="ausgabe.bild"
        :alt="ausgabe.bild_alt ?? ''"
        width="280"
        height="184"
        class="ausgabe__bild"
      />
      <p class="ausgabe__motto handschrift">{{ ausgabe.motto }}</p>
    </template>
    <template v-else>
      <h3 class="ausgabe__titel ausgabe__titel--geplant">{{ titel }}</h3>
      <p class="ausgabe__motto handschrift">erscheint im {{ JAHRESZEITEN[ausgabe.jahreszeit] }}</p>
    </template>
  </article>
</template>

<style scoped>
/* Design: 180×232, doppelter versetzter Rand (gestapelte Blätter) */
.ausgabe {
  display: flex;
  flex-direction: column;
  min-height: clamp(12rem, 16vw, 14.5rem);
  padding: 0.9rem 0.8rem 0.6rem;
  border: 2px solid var(--farbe-schwarz);
  background: var(--farbe-zeitungspapier);
  box-shadow:
    3px 3px 0 -1px var(--farbe-zeitungspapier),
    4px 4px 0 0 var(--farbe-schwarz),
    6px 6px 0 -1px var(--farbe-zeitungspapier),
    7px 7px 0 0 var(--farbe-schwarz);
  transform: rotate(-0.8deg);
}

.ausgabe:nth-child(2n) {
  transform: rotate(0.6deg);
}

.ausgabe__titel {
  padding-bottom: 0.35rem;
  border-bottom: 3px solid var(--farbe-schwarz);
  font-size: clamp(0.9375rem, 1.1vw, 1rem);
  text-align: center;
  color: var(--farbe-schwarz);
}

.ausgabe__bild {
  width: 100%;
  aspect-ratio: 140 / 92;
  object-fit: cover;
  margin-top: 0.5rem;
}

.ausgabe__motto {
  margin: auto 0 0;
  padding-top: 0.4rem;
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  text-align: center;
}

.ausgabe--geplant {
  justify-content: center;
  border: 2px dashed var(--farbe-schwarz);
  box-shadow: none;
  transform: rotate(-0.5deg);
}

.ausgabe__titel--geplant {
  border: 0;
}

.ausgabe--geplant .ausgabe__motto {
  margin: 0;
}
</style>
