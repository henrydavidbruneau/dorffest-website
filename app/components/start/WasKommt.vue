<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasKommt
const { data: termine } = await useTermine({ hervorgehoben: true, limit: 3 })

// Drehung der Zettel wie im Design
const drehungen = [-1.3, 0.8, -0.5]
</script>

<template>
  <section class="was-kommt" aria-labelledby="was-kommt-titel">
    <img
      src="/illustrationen/disco.svg"
      alt=""
      width="700"
      height="1080"
      class="was-kommt__figur"
      loading="lazy"
    >
    <div class="inhalt">
      <div class="was-kommt__kopf">
        <h2 id="was-kommt-titel" class="was-kommt__titel">
          Was <BasisHervorhebung>kommt</BasisHervorhebung>
        </h2>
        <p class="was-kommt__zusatz handschrift">{{ t.zusatz }}</p>
      </div>

      <ul class="was-kommt__termine">
        <li v-for="(termin, i) in termine" :key="termin.id">
          <BasisTerminZettel :termin="termin" :drehung="drehungen[i % 3]" />
        </li>
      </ul>

      <div class="was-kommt__text">
        <p v-for="(absatz, i) in t.absaetze" :key="i">
          <template v-for="(teil, j) in absatz" :key="j">
            <strong v-if="teil.fett">{{ teil.text }}</strong>
            <template v-else>{{ teil.text }}</template>
          </template>
        </p>
      </div>

      <BasisNewsletterBox
        variante="lila"
        :titel="t.newsletterTitel"
        :text="t.newsletterText"
        class="was-kommt__newsletter"
      />
    </div>
  </section>
</template>

<style scoped>
/* Design: 130 oben, Kopf → Zettel 113, Zettel → Text 117, Text → Newsletter 84, 95 unten */
.was-kommt {
  --farbe-fokus: var(--farbe-gelb);
  position: relative;
  padding-block: var(--abstand-sektion) clamp(3.5rem, 6.6vw, 6rem);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
  overflow: hidden;
}

.was-kommt__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 clamp(0.75rem, 1.6vw, 1.5rem);
}

.was-kommt__titel {
  font-size: var(--groesse-h2);
  color: var(--farbe-pfirsich);
}

.was-kommt__zusatz {
  margin: 0 0 -0.2em;
  color: var(--farbe-pfirsich);
  transform: rotate(-4deg);
}

/* Disco-Figur hängt rechts von oben in die Sektion */
.was-kommt__figur {
  position: absolute;
  top: clamp(2.5rem, 5.4vw, 4.9rem);
  right: max(var(--seitenrand), calc(50% - 35rem + 0.6rem));
  z-index: 1;
  width: clamp(5rem, 11.1vw, 10rem);
}

.was-kommt__termine {
  display: grid;
  gap: var(--abstand-l);
  margin: clamp(3rem, 7.8vw, 7rem) 0 0;
  padding: 0;
  list-style: none;
}

.was-kommt__termine :deep(.termin-zettel) {
  height: 100%;
  color: var(--farbe-schwarz);
}

.was-kommt__text,
.was-kommt__newsletter {
  max-width: 53.875rem;
  margin-inline: auto;
}

.was-kommt__text {
  margin-top: clamp(3rem, 8.1vw, 7.3rem);
  font-size: var(--groesse-l);
  line-height: 1.54;
}

.was-kommt__text p {
  margin: 0;
}

.was-kommt__text p + p {
  margin-top: 1.54em;
}

.was-kommt__newsletter {
  margin-top: clamp(2.5rem, 5.8vw, 5.25rem);
}

@media (min-width: 40rem) {
  .was-kommt__termine {
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  }
}

@media (min-width: 64rem) {
  .was-kommt__termine {
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(1.25rem, 2vw, 1.75rem);
  }

  .was-kommt__text {
    text-align: justify;
  }
}
</style>
