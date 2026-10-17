<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasWirTun

// leichte, unregelmäßige Drehung der Zettel wie im Design
const drehungen = [2, -1.5, 1.5, -2]
</script>

<template>
  <section id="was-wir-tun" class="was-wir-tun" aria-labelledby="was-wir-tun-titel">
    <div class="inhalt">
      <div class="was-wir-tun__kopf">
        <h2 id="was-wir-tun-titel">Was wir tun</h2>
        <p class="was-wir-tun__zusatz handschrift">{{ t.zusatz }}</p>
        <img
          src="/illustrationen/giesser.svg"
          alt=""
          width="700"
          height="700"
          class="was-wir-tun__figur"
          loading="lazy"
        >
      </div>

      <ol class="was-wir-tun__liste">
        <li v-for="(punkt, i) in t.punkte" :key="punkt.titel" class="was-wir-tun__punkt">
          <span class="was-wir-tun__nummer" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3 class="was-wir-tun__titel">{{ punkt.titel }}</h3>
          <BasisNotizzettel rahmen :drehung="drehungen[i]" class="was-wir-tun__zettel">
            {{ punkt.text }}
          </BasisNotizzettel>
        </li>
      </ol>

      <p class="was-wir-tun__haltung">{{ t.haltung }}</p>
      <div class="was-wir-tun__knopf">
        <BasisKnopf to="/ueber-uns">{{ t.knopf }}</BasisKnopf>
      </div>
    </div>
  </section>
</template>

<style scoped>
.was-wir-tun {
  padding-block: var(--abstand-l) var(--abstand-2xl);
}

.was-wir-tun__kopf {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--abstand-s);
  margin-bottom: var(--abstand-l);
}

.was-wir-tun__zusatz {
  margin: 0;
  color: var(--farbe-orange-text);
  transform: rotate(-3deg);
}

.was-wir-tun__figur {
  position: absolute;
  right: 0;
  bottom: -2rem;
  width: clamp(5rem, 3rem + 8vw, 11rem);
}

.was-wir-tun__liste {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 3px dotted var(--farbe-orange);
}

.was-wir-tun__punkt {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--abstand-s) var(--abstand-m);
  align-items: center;
  padding-block: var(--abstand-l);
  border-bottom: 3px dotted var(--farbe-orange);
}

.was-wir-tun__nummer {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  line-height: 1;
  color: var(--farbe-orange);
}

.was-wir-tun__titel {
  font-size: var(--groesse-h3);
}

.was-wir-tun__zettel {
  grid-column: 1 / -1;
  font-size: var(--groesse-s);
  line-height: 1.5;
}

.was-wir-tun__haltung {
  max-width: 44rem;
  margin: var(--abstand-xl) auto var(--abstand-m);
  text-align: center;
}

.was-wir-tun__knopf {
  text-align: center;
}

@media (min-width: 48rem) {
  .was-wir-tun__punkt {
    grid-template-columns: 6rem 1fr minmax(14rem, 19rem);
    padding-block: var(--abstand-m);
  }

  .was-wir-tun__nummer,
  .was-wir-tun__titel {
    font-size: clamp(2rem, 1rem + 2.5vw, 3.25rem);
  }

  .was-wir-tun__zettel {
    grid-column: auto;
    padding: var(--abstand-s);
    font-size: var(--groesse-xs);
  }
}
</style>
