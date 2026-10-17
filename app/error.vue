<script setup lang="ts">
// Fehlerseite (404 und andere) im Stil der Seite
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const nichtGefunden = computed(() => props.error.statusCode === 404)

useHead({
  titleTemplate: (titel?: string) => (titel ? `${titel} · Königsdorf rückt zusammen` : 'Königsdorf rückt zusammen'),
})
useSeoMeta({ title: () => (nichtGefunden.value ? 'Nicht gefunden' : 'Fehler'), robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <section class="fehler inhalt">
      <BasisNotizzettel farbe="pfirsich" tape="mitte" tape-farbe="flieder" :drehung="-2" class="fehler__zettel">
        <p class="fehler__code">{{ error.statusCode }}</p>
        <p class="fehler__zusatz handschrift">{{ nichtGefunden ? 'huch – hier ist niemand.' : 'da ist was schiefgelaufen.' }}</p>
      </BasisNotizzettel>

      <div class="fehler__text">
        <h1 class="fehler__titel">
          <template v-if="nichtGefunden">Diese Seite ist wohl <BasisHervorhebung>umgezogen</BasisHervorhebung></template>
          <template v-else>Ups, ein <BasisHervorhebung>Fehler</BasisHervorhebung></template>
        </h1>
        <p>
          {{ nichtGefunden
            ? 'Vielleicht ist der Link alt oder hat einen Tippfehler. Macht nix – im Dorf findet man sich immer wieder.'
            : 'Bitte versuch es gleich noch einmal. Wenn es nicht klappt, schreib uns.' }}
        </p>
        <div class="fehler__knoepfe">
          <BasisKnopf to="/" @click="clearError({ redirect: '/' })">Zur Startseite</BasisKnopf>
          <BasisKnopf to="/#was-kommt" variante="outline">Was kommt</BasisKnopf>
          <BasisKnopf to="/dorfanzeiger" variante="outline">Dorfanzeiger</BasisKnopf>
        </div>
      </div>

      <img src="/illustrationen/frau-mit-kind.svg" alt="" width="400" height="700" class="fehler__figur">
    </section>
  </NuxtLayout>
</template>

<style scoped>
.fehler {
  position: relative;
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
  min-height: calc(100svh - var(--kopf-hoehe));
  padding-block: var(--abstand-xl);
}

.fehler__zettel {
  justify-self: center;
  padding: 2rem 2.5rem 1.5rem;
  text-align: center;
}

.fehler__zettel p {
  margin: 0;
}

.fehler__code {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(6rem, 16vw, 12rem);
  line-height: 0.85;
  color: var(--farbe-orange);
}

.fehler__zusatz {
  color: var(--farbe-lila);
}

.fehler__titel {
  font-size: var(--groesse-h2);
}

.fehler__text p {
  max-width: 32rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.fehler__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-top: var(--abstand-l);
}

.fehler__figur {
  position: absolute;
  right: var(--seitenrand);
  bottom: var(--abstand-l);
  width: clamp(4rem, 7vw, 6.5rem);
}

@media (min-width: 56rem) {
  .fehler {
    grid-template-columns: auto 1fr;
  }
}

@media (max-width: 55.99rem) {
  .fehler__figur {
    display: none;
  }
}
</style>
