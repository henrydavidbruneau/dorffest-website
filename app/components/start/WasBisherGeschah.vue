<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasBisherGeschah
const { data: artikel } = await useDorfanzeiger({ hervorgehoben: true, limit: 3 })
</script>

<template>
  <section class="geschah" aria-labelledby="geschah-titel">
    <div class="inhalt">
      <h2 id="geschah-titel" class="geschah__titel">
        Was bisher <BasisHervorhebung>geschah</BasisHervorhebung>
      </h2>
      <p class="geschah__text">{{ t.text }}</p>

      <div v-einblenden class="geschah__zeitung">
        <div class="geschah__masthead">
          <div>
            <p class="geschah__zusatz handschrift">{{ t.zusatz }}</p>
            <h3 class="geschah__zeitungstitel">{{ t.titel }}</h3>
          </div>
          <NuxtLink to="/dorfanzeiger" class="geschah__link handlink">→ {{ t.link }}</NuxtLink>
        </div>

        <div class="geschah__artikel">
          <BasisArtikelTeaser v-for="a in artikel" :key="a.id" :artikel="a" :ebene="4" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Design: 137 oben, Text 40 unter Titel, Karte 59 darunter und 66px breiter als der Inhalt */
.geschah {
  padding-block: var(--abstand-sektion) clamp(4rem, 11vw, 10rem);
  background: var(--farbe-pfirsich);
  overflow-x: clip;
}

.geschah__titel {
  font-size: var(--groesse-h2);
  text-align: center;
}

.geschah__text {
  max-width: 41rem;
  margin: clamp(1.25rem, 2.8vw, 2.5rem) auto 0;
  font-size: var(--groesse-l);
  line-height: 1.54;
  text-align: center;
  color: var(--farbe-lila);
}

.geschah__zeitung {
  margin-top: clamp(2rem, 4.1vw, 3.7rem);
  padding: clamp(1.25rem, 3.2vw, 2.9rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-creme);
  box-shadow: var(--schatten-karte);
  transform: rotate(-0.5deg);
}

.geschah__masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--abstand-2xs) var(--abstand-m);
  padding-bottom: clamp(0.5rem, 1vw, 0.9rem);
  border-bottom: 5px solid var(--farbe-schwarz);
}

.geschah__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.geschah__zeitungstitel {
  font-size: var(--groesse-masthead);
  line-height: 0.95;
  color: var(--farbe-schwarz);
}

.geschah__link {
  color: var(--farbe-lila);
}

.geschah__artikel {
  display: grid;
  gap: var(--abstand-l);
  margin-top: clamp(1.25rem, 2.2vw, 2rem);
}

/* Zeitung wird schräg auf den Tisch gelegt */
:root.js .geschah__zeitung:not(.ist-sichtbar) {
  opacity: 0;
}

.geschah__zeitung.ist-sichtbar {
  animation: hinlegen 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes hinlegen {
  from {
    opacity: 0;
    transform: translate(3rem, 2.5rem) rotate(3deg);
  }
}

@media (min-width: 48rem) {
  .geschah__zeitung {
    /* breiter als der Inhalt, aber nie über den Seitenrand hinaus (sonst Querscrollen auf Tablets) */
    margin-inline: calc(-1 * min(4.6vw, 4.125rem, var(--seitenrand) - 0.5rem));
  }

  .geschah__artikel {
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }

  /* graue Spaltenlinien zwischen den Artikeln */
  .geschah__artikel > * {
    padding-inline: clamp(1rem, 2.6vw, 2.35rem);
  }

  .geschah__artikel > * + * {
    border-left: 1px solid var(--farbe-spaltenlinie);
  }

  .geschah__artikel > :first-child {
    padding-left: 0;
  }

  .geschah__artikel > :last-child {
    padding-right: 0;
  }
}
</style>
