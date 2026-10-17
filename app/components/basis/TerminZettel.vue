<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    termin: Termin
    drehung?: number
    tape?: false | 'links' | 'mitte' | 'rechts'
    tapeFarbe?: 'gelb' | 'flieder' | 'pfirsich'
    /** Überschriftenebene des Titels */
    ebene?: 2 | 3 | 4
  }>(),
  { drehung: 0, tape: false, tapeFarbe: 'gelb', ebene: 3 },
)

const datum = computed(() =>
  props.termin.beginn ? tagMonat(props.termin.beginn) : (props.termin.datum_text ?? ''),
)
const wochentag = computed(() => (props.termin.beginn ? wochentagKurz(props.termin.beginn) : null))
const zeile = computed(() => {
  const { beginn, ort, hinweis } = props.termin
  if (hinweis) return hinweis
  const zeit = beginn && !props.termin.uhrzeit_folgt ? uhrzeit(beginn) : null
  return [zeit, ort ?? 'Ort folgt'].filter(Boolean).join(' · ')
})
</script>

<template>
  <BasisNotizzettel
    as="article"
    class="termin-zettel"
    farbe="pfirsich"
    radius="l"
    :drehung="drehung"
    :tape="tape"
    :tape-farbe="tapeFarbe"
  >
    <p class="termin-zettel__datum">
      <time v-if="termin.beginn" :datetime="termin.beginn">
        <span class="termin-zettel__tag">{{ datum }}</span>
        <span class="termin-zettel__wochentag">{{ wochentag }}</span>
      </time>
      <span v-else class="termin-zettel__tag">{{ datum }}</span>
    </p>
    <component :is="`h${ebene}`" class="termin-zettel__titel">{{ termin.titel }}</component>
    <p class="termin-zettel__zeile">{{ zeile }}</p>
    <BasisTrennlinie class="termin-zettel__linie" />
    <NuxtLink :to="`/termine/${termin.slug}`" class="termin-zettel__link">
      {{ termin.aufruf_text ?? 'Details' }} <span aria-hidden="true">→</span>
      <span class="nur-screenreader">: {{ termin.titel }}</span>
    </NuxtLink>
  </BasisNotizzettel>
</template>

<style scoped>
.termin-zettel {
  display: flex;
  flex-direction: column;
  padding: clamp(1.25rem, 2.2vw, 2rem) clamp(1.25rem, 1.9vw, 1.75rem) clamp(1rem, 1.7vw, 1.5rem);
}

.termin-zettel p {
  margin: 0;
}

.termin-zettel__datum time {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.termin-zettel__tag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-datum);
  line-height: 0.95;
  color: var(--farbe-orange);
}

.termin-zettel__wochentag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.25rem, 1.74vw, 1.5625rem);
  color: var(--farbe-lila);
}

.termin-zettel__titel {
  margin-top: clamp(0.4rem, 0.8vw, 0.75rem);
  font-size: var(--groesse-h3);
  line-height: 1.05;
}

.termin-zettel__zeile {
  margin-top: 0.35rem !important;
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  font-weight: var(--gewicht-text-normal);
}

.termin-zettel__linie {
  margin-block: clamp(0.6rem, 1vw, 0.9rem) clamp(0.9rem, 1.5vw, 1.35rem);
}

.termin-zettel__link {
  align-self: flex-start;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-knopf);
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.termin-zettel__link:hover {
  text-decoration: underline;
}
</style>
