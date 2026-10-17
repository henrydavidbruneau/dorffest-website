<script setup lang="ts">
// Große Kachel für den nächsten Termin (Startseite, "Was kommt")
const props = defineProps<{ termin: Termin }>()

const link = computed(() => `/termine/${props.termin.slug}`)
const datum = computed(() => (props.termin.beginn ? tagMonat(props.termin.beginn) : props.termin.datum_text ?? ''))
const zeile = computed(() => {
  const t = props.termin
  if (!t.beginn) return t.hinweis ?? ''
  return `${datumAusgeschrieben(t.beginn)} · ${uhrzeit(t.beginn)} Uhr · ${t.ort ?? 'Ort folgt'}`
})
</script>

<template>
  <article class="naechster">
    <div class="naechster__bild">
      <NuxtImg
        v-if="termin.bild"
        :src="termin.bild"
        :alt="termin.bild_alt ?? ''"
        width="840"
        height="640"
        sizes="100vw md:420px"
      />
      <p v-else class="naechster__datum-gross" aria-hidden="true">{{ datum }}</p>
    </div>
    <div class="naechster__text">
      <p class="naechster__zusatz handschrift">als Nächstes</p>
      <h3 class="naechster__titel">
        <NuxtLink :to="link">{{ termin.titel }}</NuxtLink>
      </h3>
      <p class="naechster__zeile">
        <time v-if="termin.beginn" :datetime="termin.beginn">{{ zeile }}</time>
        <template v-else>{{ zeile }}</template>
      </p>
      <p v-if="termin.kurzbeschreibung" class="naechster__beschreibung">{{ termin.kurzbeschreibung }}</p>
      <div class="naechster__knoepfe">
        <BasisKnopf :to="link">Mehr erfahren</BasisKnopf>
        <BasisKnopf v-if="termin.anmeldung_aktiv" :to="`${link}#anmeldung`" variante="outline">Anmelden</BasisKnopf>
      </div>
    </div>
  </article>
</template>

<style scoped>
.naechster {
  --farbe-fokus: var(--farbe-lila);
  display: grid;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: var(--farbe-pfirsich);
  box-shadow: 0 14px 30px rgb(0 0 0 / 0.25);
  color: var(--farbe-schwarz);
  transform: rotate(-0.6deg);
}

.naechster__bild {
  display: grid;
  place-items: center;
  min-height: 14rem;
  background: var(--farbe-gelb);
}

.naechster__bild img {
  width: 100%;
  height: 100%;
  aspect-ratio: 21 / 16;
  object-fit: cover;
  object-position: top;
}

.naechster__datum-gross {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(5rem, 10vw, 8rem);
  color: var(--farbe-orange);
}

.naechster__text {
  display: flex;
  flex-direction: column;
  padding: clamp(1.5rem, 3.2vw, 2.75rem);
}

.naechster__text p {
  margin: 0;
}

.naechster__zusatz {
  color: var(--farbe-orange-text);
  transform: rotate(-2deg);
  transform-origin: left;
}

.naechster__titel {
  margin-top: 0.3rem;
  font-size: clamp(2.25rem, 4.4vw, 3.75rem);
  line-height: 0.95;
}

.naechster__titel a {
  text-decoration: none;
}

.naechster__titel a:hover {
  text-decoration: underline;
}

.naechster .naechster__zeile {
  margin-top: 0.75rem;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-m);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.naechster .naechster__beschreibung {
  margin-top: var(--abstand-s);
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.naechster__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-top: var(--abstand-m);
}

@media (min-width: 48rem) {
  .naechster {
    grid-template-columns: 0.85fr 1fr;
  }

  .naechster__bild img {
    aspect-ratio: auto;
  }
}
</style>
