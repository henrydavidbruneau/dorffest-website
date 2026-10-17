<script setup lang="ts">
import { links } from '~/navigation'
import { texte } from '~/texte'

const t = texte.start.nimmDirEinen
const ABREISSER = 6
</script>

<template>
  <section id="mitmachen" class="nimm" aria-labelledby="nimm-titel">
    <div class="nimm__raster inhalt">
      <div class="nimm__text">
        <h2 id="nimm-titel" class="nimm__titel">
          Nimm dir<br>
          <BasisHervorhebung>einen!</BasisHervorhebung>
        </h2>
        <p>{{ t.text }}</p>
      </div>

      <BasisNotizzettel farbe="creme" radius="xl" befestigung="pin" :drehung="1.2" class="nimm__zettel">
        <div class="nimm__zettel-kopf">
          <p class="nimm__zettel-zusatz handschrift">{{ t.zettelZusatz }}</p>
          <p class="nimm__zettel-titel display">{{ t.zettelTitel }}</p>
          <p class="nimm__zettel-text">{{ t.zettelText }}</p>
        </div>

        <ul class="nimm__abreisser">
          <li v-for="i in ABREISSER" :key="i">
            <!-- Für Screenreader/Tastatur reicht ein Link; die übrigen sind Deko -->
            <NuxtLink
              :to="links.mitmachen"
              class="nimm__abreisser-link"
              :aria-hidden="i > 1 ? 'true' : undefined"
              :tabindex="i > 1 ? -1 : undefined"
            >
              {{ t.abreisser }}→
            </NuxtLink>
          </li>
        </ul>
      </BasisNotizzettel>
    </div>
  </section>
</template>

<style scoped>
/* Design: Sektion 846 hoch, Titel 112px, Zettel 620 breit und 66px über den Inhaltsrand */
.nimm {
  display: flex;
  align-items: center;
  min-height: clamp(30rem, 58.75vw, 52.875rem);
  padding-block: var(--abstand-sektion);
  background: var(--farbe-orange);
  color: var(--farbe-schwarz);
}

.nimm__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
}

.nimm__titel {
  font-size: var(--groesse-h2-gross);
  line-height: 0.85;
}

.nimm__titel :deep(.hervorhebung) {
  margin-top: 0.05em;
  padding: 0.05em 0.14em 0.04em;
}

.nimm__text p {
  max-width: 29rem;
  margin: clamp(1.5rem, 3vw, 2.6rem) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.64;
  color: var(--farbe-creme);
}

.nimm__zettel {
  width: 100%;
  max-width: 39rem;
  padding: 0;
  overflow: hidden;
}

.nimm__zettel-kopf {
  padding: clamp(3rem, 4.7vw, 4.25rem) clamp(1.5rem, 3.9vw, 3.5rem) clamp(1rem, 1.4vw, 1.25rem);
}

.nimm__zettel p {
  margin: 0;
}

.nimm__zettel-zusatz {
  font-size: var(--groesse-hand-xl);
  line-height: 1;
  color: var(--farbe-orange-text);
}

.nimm__zettel-titel {
  font-size: clamp(3.5rem, 6vw, 5.4rem);
  line-height: 0.95;
  color: var(--farbe-lila);
}

.nimm__zettel-text {
  max-width: 26rem;
  margin-top: clamp(0.75rem, 1.4vw, 1.25rem) !important;
  font-size: var(--groesse-s);
  line-height: 1.7;
}

.nimm__abreisser {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 2px dashed var(--farbe-lila);
}

.nimm__abreisser li + li {
  border-left: 2px dashed var(--farbe-lila);
}

.nimm__abreisser-link {
  display: grid;
  place-items: center;
  height: clamp(9rem, 14vw, 12.5rem);
  width: 100%;
  font-size: clamp(0.875rem, 1.1vw, 1rem);
  font-weight: var(--gewicht-text-normal);
  text-decoration: none;
  color: var(--farbe-lila);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  transition: transform var(--dauer-mittel) ease;
}

/* Abreißen andeuten */
.nimm__abreisser-link:hover,
.nimm__abreisser-link:focus-visible {
  transform: rotate(186deg) translateY(-4px);
}

@media (min-width: 56rem) {
  .nimm__raster {
    grid-template-columns: 0.48fr 0.52fr;
  }

  .nimm__zettel {
    justify-self: end;
    margin-right: calc(-1 * min(4.6vw, 4.125rem));
  }
}
</style>
