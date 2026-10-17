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
  { drehung: 0, tape: 'mitte', tapeFarbe: 'gelb', ebene: 3 },
)

const datum = computed(() =>
  props.termin.beginn ? tagMonat(props.termin.beginn) : (props.termin.datum_text ?? ''),
)
const wochentag = computed(() => (props.termin.beginn ? wochentagKurz(props.termin.beginn) : null))
const zeile = computed(() => {
  const { beginn, ort, hinweis } = props.termin
  if (hinweis) return hinweis
  return [beginn ? uhrzeit(beginn) : null, ort ?? 'Ort folgt'].filter(Boolean).join(' · ')
})
</script>

<template>
  <BasisNotizzettel
    as="article"
    class="termin-zettel"
    farbe="pfirsich"
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
    <BasisTrennlinie art="gestrichelt" farbe="lila" />
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
  gap: var(--abstand-2xs);
  padding: var(--abstand-m) var(--abstand-m) var(--abstand-s);
}

.termin-zettel p {
  margin: 0;
}

.termin-zettel__datum time {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.termin-zettel__tag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(2.5rem, 2rem + 2vw, 3.25rem);
  line-height: 1;
  color: var(--farbe-orange);
}

.termin-zettel__wochentag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-l);
  color: var(--farbe-lila);
}

.termin-zettel__titel {
  font-size: var(--groesse-xl);
  line-height: 1;
}

.termin-zettel__zeile {
  font-size: var(--groesse-xs);
}

.termin-zettel__link {
  align-self: flex-start;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-s);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.termin-zettel__link:hover {
  text-decoration: underline;
}
</style>
