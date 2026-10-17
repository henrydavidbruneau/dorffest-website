<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    artikel: Artikel
    /**
     * karte:   Startseite (Bild, Text, Datum in Handschrift)
     * spalte:  Dorfanzeiger 3er-Reihe (Bild, Text, "Weiterlesen")
     * kompakt: Dorfanzeiger Seitenspalte (ohne Bild)
     */
    variante?: 'karte' | 'spalte' | 'kompakt'
    ebene?: 2 | 3 | 4
  }>(),
  { variante: 'karte', ebene: 3 },
)

const link = computed(() => `/dorfanzeiger/${props.artikel.slug}`)
const mitBild = computed(() => props.variante !== 'kompakt' && !!props.artikel.bild)
const datum = computed(() => {
  const { datum_text, veroeffentlicht_am } = props.artikel
  if (datum_text) return datum_text
  return veroeffentlicht_am ? datumLang(veroeffentlicht_am) : 'Datum folgt'
})
</script>

<template>
  <article class="teaser" :class="`teaser--${variante}`">
    <NuxtImg
      v-if="mitBild"
      :src="artikel.bild!"
      :alt="artikel.bild_alt ?? ''"
      width="480"
      height="320"
      sizes="100vw sm:50vw md:400px"
      class="teaser__bild"
    />
    <p class="teaser__ressort">{{ RESSORTS[artikel.ressort] }}</p>
    <component :is="`h${ebene}`" class="teaser__titel">
      <NuxtLink :to="link" class="teaser__link">{{ artikel.titel }}</NuxtLink>
    </component>
    <p class="teaser__text">{{ artikel.teaser }}</p>
    <p v-if="variante === 'karte'" class="teaser__datum handschrift">
      <time v-if="!artikel.datum_text && artikel.veroeffentlicht_am" :datetime="artikel.veroeffentlicht_am">{{ datum }}</time>
      <template v-else>{{ datum }}</template>
    </p>
    <p v-else class="teaser__weiter" aria-hidden="true">Weiterlesen →</p>
  </article>
</template>

<style scoped>
.teaser {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
}

.teaser p {
  margin: 0;
}

.teaser__bild {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  margin-bottom: var(--abstand-2xs);
}

.teaser__ressort {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.teaser__titel {
  font-size: var(--groesse-xl);
  line-height: 1;
}

.teaser__link {
  text-decoration: none;
}

/* ganze Karte klickbar */
.teaser__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.teaser:hover .teaser__link {
  text-decoration: underline;
}

.teaser__text {
  font-size: var(--groesse-s);
}

.teaser__datum {
  margin-top: auto;
}

.teaser__weiter {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-xs);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.teaser--kompakt .teaser__titel {
  font-size: var(--groesse-l);
}
</style>
