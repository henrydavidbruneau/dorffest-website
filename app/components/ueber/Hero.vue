<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.ueberUns

// Bildreihe: läuft rechts aus dem Bild, auf schmalen Bildschirmen wischbar
const bilder = [
  { src: '/fotos/team-dorffest.webp', alt: 'Das Helfer*innen-Team vom Dorffest in weißen T-Shirts vor dem Bierwagen', breite: 552 },
  { src: '/fotos/was-uns-verbindet.webp', alt: 'Wand „Was uns verbindet“ mit vielen bunten, handbeschriebenen Zetteln', breite: 552 },
  { src: '/fotos/dorffest-gelaende.webp', alt: 'Das Dorffest-Gelände von oben: Wiese mit Zelten und Bierbänken neben der Kirche', breite: 552 },
]
</script>

<template>
  <section class="uhero" aria-labelledby="uhero-titel">
    <div class="inhalt">
      <p class="uhero__zusatz handschrift">{{ t.zusatz }}</p>
      <h1 id="uhero-titel" class="uhero__titel">
        Königsdorf<br>
        <BasisHervorhebung>gemeinsam</BasisHervorhebung> gestalten
      </h1>
      <p class="uhero__intro">{{ t.intro }}</p>
    </div>

    <ul class="uhero__bilder" aria-label="Bilder aus dem Vereinsleben">
      <li v-for="b in bilder" :key="b.src" :style="{ '--breite': b.breite }">
        <NuxtImg :src="b.src" :alt="b.alt" :width="b.breite * 2" height="790" sizes="80vw md:760px" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Design: "über uns" 38, Titel 118 (2 Zeilen), Intro 22/37, Bildreihe 395 hoch ab x=80 */
.uhero {
  padding-top: clamp(2.5rem, 5vw, 4.4rem);
}

.uhero__zusatz {
  margin: 0;
  color: var(--farbe-orange);
}

.uhero__titel {
  margin-top: clamp(0.75rem, 2vw, 1.75rem);
  font-size: clamp(3rem, 8.2vw, 7.375rem);
  line-height: 0.92;
}

.uhero__titel :deep(.hervorhebung) {
  margin-top: 0.02em;
  padding: 0.06em 0.12em 0.03em;
}

.uhero__intro {
  max-width: 37rem;
  margin: clamp(1rem, 2vw, 1.75rem) 0 0;
  font-size: clamp(1.125rem, 1.53vw, 1.375rem);
  line-height: 1.68;
}

.uhero__bilder {
  --hoehe: clamp(13rem, 27.4vw, 24.7rem);
  display: flex;
  gap: clamp(1.25rem, 3.3vw, 3rem);
  margin: clamp(2rem, 4.9vw, 4.4rem) 0 0;
  padding: 0 0 0.5rem max(var(--seitenrand), calc(50% - 40rem));
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: max(var(--seitenrand), calc(50% - 40rem));
  scrollbar-width: none;
}

.uhero__bilder::-webkit-scrollbar {
  display: none;
}

.uhero__bilder li {
  flex: none;
  width: calc(var(--hoehe) * var(--breite) / 395);
  height: var(--hoehe);
  scroll-snap-align: start;
}

.uhero__bilder img {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-m);
  object-fit: cover;
  object-position: top;
}
</style>
