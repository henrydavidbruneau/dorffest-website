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
          <BasisHervorhebung :drehung="-2">einen!</BasisHervorhebung>
        </h2>
        <p>{{ t.text }}</p>
      </div>

      <BasisNotizzettel as="div" farbe="creme" befestigung="pin" :drehung="3" class="nimm__zettel">
        <p class="nimm__zettel-zusatz handschrift">{{ t.zettelZusatz }}</p>
        <p class="nimm__zettel-titel display">{{ t.zettelTitel }}</p>
        <p class="nimm__zettel-text">{{ t.zettelText }}</p>

        <ul class="nimm__abreisser">
          <li v-for="i in ABREISSER" :key="i">
            <!-- Für Screenreader/Tastatur reicht ein Link; die übrigen sind Deko -->
            <NuxtLink
              :to="links.mitmachen"
              class="nimm__abreisser-link handschrift"
              :aria-hidden="i > 1 ? 'true' : undefined"
              :tabindex="i > 1 ? -1 : undefined"
            >
              {{ t.abreisser }} →
            </NuxtLink>
          </li>
        </ul>
      </BasisNotizzettel>
    </div>
  </section>
</template>

<style scoped>
.nimm {
  padding-block: var(--abstand-2xl);
  background: var(--farbe-orange);
  color: var(--farbe-schwarz);
}

.nimm__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
}

.nimm__titel {
  margin-bottom: var(--abstand-m);
}

.nimm__text p {
  max-width: 26rem;
  font-size: var(--groesse-s);
}

.nimm__zettel {
  max-width: 34rem;
  padding: var(--abstand-l) var(--abstand-l) 0;
}

.nimm__zettel p {
  margin: 0;
}

.nimm__zettel-zusatz {
  font-size: 2rem;
  color: var(--farbe-orange-text);
}

.nimm__zettel-titel {
  font-size: clamp(4rem, 2rem + 8vw, 7rem);
  color: var(--farbe-lila);
}

.nimm__zettel-text {
  margin-bottom: var(--abstand-m) !important;
  font-size: var(--groesse-s);
}

.nimm__abreisser {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin: 0 calc(-1 * var(--abstand-l));
  padding: 0;
  list-style: none;
  border-top: 2px dashed var(--farbe-schwarz);
}

.nimm__abreisser li + li {
  border-left: 2px dashed var(--farbe-schwarz);
}

.nimm__abreisser-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 9rem;
  padding-block: var(--abstand-xs);
  font-size: 1.4rem;
  text-decoration: none;
  color: var(--farbe-lila);
  writing-mode: vertical-rl;
  transform-origin: top center;
  transition: transform var(--dauer-mittel) ease;
}

/* Abreißen andeuten */
.nimm__abreisser-link:hover,
.nimm__abreisser-link:focus-visible {
  transform: rotate(-6deg) translateY(3px);
}

@media (min-width: 56rem) {
  .nimm__raster {
    grid-template-columns: 1fr 1.1fr;
  }

  .nimm__zettel {
    justify-self: end;
  }
}
</style>
