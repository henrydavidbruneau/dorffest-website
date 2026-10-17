<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasKommt
const { data: termine } = await useTermine({ hervorgehoben: true, limit: 3 })

// unregelmäßige Zettel wie im Design
const zettel = [
  { drehung: -2, tape: 'links', tapeFarbe: 'gelb' },
  { drehung: 1.5, tape: 'mitte', tapeFarbe: 'flieder' },
  { drehung: -1, tape: 'rechts', tapeFarbe: 'gelb' },
] as const
</script>

<template>
  <section class="was-kommt" aria-labelledby="was-kommt-titel">
    <div class="inhalt">
      <div class="was-kommt__kopf">
        <h2 id="was-kommt-titel" class="was-kommt__titel">
          Was <BasisHervorhebung :drehung="2">kommt</BasisHervorhebung>
        </h2>
        <p class="was-kommt__zusatz handschrift">{{ t.zusatz }}</p>
        <img
          src="/illustrationen/disco.svg"
          alt=""
          width="700"
          height="1080"
          class="was-kommt__figur"
          loading="lazy"
        >
      </div>

      <ul class="was-kommt__termine">
        <li v-for="(termin, i) in termine" :key="termin.id">
          <BasisTerminZettel
            :termin="termin"
            :drehung="zettel[i % 3]!.drehung"
            :tape="zettel[i % 3]!.tape"
            :tape-farbe="zettel[i % 3]!.tapeFarbe"
          />
        </li>
      </ul>

      <div class="was-kommt__text">
        <p v-for="absatz in t.absaetze" :key="absatz">{{ absatz }}</p>
        <p><strong>{{ t.schluss }}</strong></p>
      </div>

      <BasisNewsletterBox variante="lila" :titel="t.newsletterTitel" :text="t.newsletterText" />
    </div>
  </section>
</template>

<style scoped>
.was-kommt {
  --farbe-fokus: var(--farbe-gelb);
  padding-block: var(--abstand-2xl);
  background: var(--farbe-lila);
  color: var(--farbe-pfirsich);
  overflow: hidden;
}

.was-kommt__kopf {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--abstand-s);
  margin-bottom: var(--abstand-xl);
}

.was-kommt__titel {
  color: var(--farbe-pfirsich);
}

.was-kommt__zusatz {
  margin: 0;
  font-size: 2rem;
  color: var(--farbe-orange);
  transform: rotate(-4deg);
}

.was-kommt__figur {
  position: absolute;
  top: calc(-1 * var(--abstand-2xl));
  right: 0;
  width: clamp(5rem, 3rem + 7vw, 9.5rem);
}

.was-kommt__termine {
  display: grid;
  gap: var(--abstand-l);
  margin: 0 0 var(--abstand-2xl);
  padding: 0;
  list-style: none;
}

.was-kommt__termine :deep(.termin-zettel) {
  height: 100%;
  color: var(--farbe-schwarz);
}

.was-kommt__text {
  max-width: 50rem;
  margin: 0 auto var(--abstand-xl);
  font-size: var(--groesse-s);
}

@media (min-width: 40rem) {
  .was-kommt__termine {
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  }
}

@media (min-width: 64rem) {
  .was-kommt__termine {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--abstand-xl);
    padding-inline: var(--abstand-l);
  }

  .was-kommt__text {
    text-align: justify;
    hyphens: auto;
  }
}
</style>
