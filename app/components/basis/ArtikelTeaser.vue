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
      width="740"
      height="490"
      sizes="100vw md:33vw lg:370px"
      class="teaser__bild"
    />
    <p class="teaser__ressort">{{ RESSORTS[artikel.ressort] }}</p>
    <component :is="`h${ebene}`" class="teaser__titel">
      <NuxtLink :to="link" class="teaser__link">{{ artikel.teaser_titel ?? artikel.titel }}</NuxtLink>
    </component>
    <p class="teaser__text">
      {{ variante === 'karte' ? (artikel.teaser_kurz ?? artikel.teaser) : artikel.teaser }}
      <span v-if="variante === 'kompakt'" class="teaser__weiter" aria-hidden="true">Weiter →</span>
    </p>
    <p v-if="variante === 'karte'" class="teaser__datum handschrift">
      <time v-if="!artikel.datum_text && artikel.veroeffentlicht_am" :datetime="artikel.veroeffentlicht_am">{{ datum }}</time>
      <template v-else>{{ datum }}</template>
    </p>
    <p v-if="variante === 'spalte'" class="teaser__weiter" aria-hidden="true">Weiterlesen →</p>
  </article>
</template>

<style scoped>
.teaser {
  position: relative;
  display: flex;
  flex-direction: column;
}

.teaser p {
  margin: 0;
}

.teaser__bild {
  width: 100%;
  aspect-ratio: 370 / 245;
  object-fit: cover;
  object-position: top;
  margin-bottom: clamp(0.75rem, 1.1vw, 1rem);
}

.teaser__ressort {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-m);
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.teaser__titel {
  margin-top: 0.4rem;
  font-size: var(--groesse-h3);
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

.teaser .teaser__text {
  margin-top: 0.6rem;
  font-size: var(--groesse-m);
  line-height: 1.55;
}

.teaser .teaser__datum {
  margin-top: auto;
  padding-top: var(--abstand-l);
  font-size: var(--groesse-hand-m);
}

.teaser .teaser__weiter {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

/* ---------- Dorfanzeiger: 3er-Reihe (Bild 315×180, Titel 28, Text 15) ---------- */
.teaser--spalte .teaser__bild {
  aspect-ratio: 7 / 4;
}

.teaser--spalte .teaser__titel {
  font-size: clamp(1.375rem, 1.94vw, 1.75rem);
}

.teaser--spalte .teaser__text,
.teaser--kompakt .teaser__text {
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  font-weight: var(--gewicht-text-normal);
}

.teaser--spalte .teaser__weiter {
  margin-top: 1.1rem;
}

/* ---------- Dorfanzeiger: Seitenspalte (Titel 24, ohne Bild) ---------- */
.teaser--kompakt .teaser__ressort,
.teaser--spalte .teaser__ressort {
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
}

.teaser--kompakt .teaser__titel {
  font-size: clamp(1.25rem, 1.67vw, 1.5rem);
}

.teaser--kompakt .teaser__weiter {
  white-space: nowrap;
}
</style>
