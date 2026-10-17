<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasWirTun

// Drehung der Zettel wie im Design
const drehungen = [-1.5, 1, -1.5, 1]
</script>

<template>
  <section id="was-wir-tun" class="was-wir-tun" aria-labelledby="was-wir-tun-titel">
    <div class="inhalt">
      <div class="was-wir-tun__kopf">
        <h2 id="was-wir-tun-titel" class="was-wir-tun__titel">Was wir tun</h2>
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

      <ol class="was-wir-tun__liste strich-oben">
        <li v-for="(punkt, i) in t.punkte" :key="punkt.titel" class="was-wir-tun__punkt strich-unten">
          <span class="was-wir-tun__nummer" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3 class="was-wir-tun__punkttitel">{{ punkt.titel }}</h3>
          <BasisNotizzettel
            v-einblenden
            farbe="creme"
            rahmen="orange"
            tape="mitte"
            tape-farbe="flieder"
            :tape-drehung="0"
            :drehung="drehungen[i]"
            class="was-wir-tun__zettel"
          >
            {{ punkt.text }}
          </BasisNotizzettel>
        </li>
      </ol>

      <p class="was-wir-tun__haltung">{{ t.haltung }}</p>
      <div class="was-wir-tun__knopf">
        <BasisKnopf to="/ueber-uns" groesse="gross">{{ t.knopf }}</BasisKnopf>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Design: Überschrift → Liste 119, Zeilen 170 hoch, Haltung 90 darunter, 132 Abstand unten */
.was-wir-tun {
  padding-block: clamp(2rem, 4vw, 3.5rem) var(--abstand-sektion);
}

@media (min-width: 48rem) {
  .was-wir-tun {
    padding-top: clamp(8rem, 16vw, 14.5rem);
  }
}

.was-wir-tun__kopf {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0 clamp(1rem, 2vw, 1.75rem);
  margin-bottom: clamp(2rem, 4vw, 3.6rem);
}

.was-wir-tun__titel {
  font-size: var(--groesse-h2);
}

.was-wir-tun__zusatz {
  margin: 0 0 0.1em;
  color: var(--farbe-lila);
  transform: rotate(-5deg);
}

/* Gießer: rechts, ragt über die erste Zeile */
.was-wir-tun__figur {
  position: absolute;
  top: clamp(0.8rem, 2vw, 1.75rem);
  right: max(-1rem, -1.4vw);
  z-index: 2;
  width: clamp(5rem, 11vw, 10rem);
  pointer-events: none;
}

.was-wir-tun__liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

.was-wir-tun__punkt {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--abstand-s) var(--abstand-m);
  align-items: center;
  padding-block: var(--abstand-l) calc(var(--abstand-l) + var(--strich-dicke));
}

.was-wir-tun__nummer,
.was-wir-tun__punkttitel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-zeile);
  line-height: 0.92;
  text-transform: uppercase;
}

.was-wir-tun__nummer {
  color: var(--farbe-orange);
}

.was-wir-tun__zettel {
  grid-column: 1 / -1;
  padding: 1.1rem 1.4rem;
  font-size: clamp(0.8125rem, 1vw, 0.9rem);
  line-height: 1.6;
}

.was-wir-tun__haltung {
  max-width: 52rem;
  margin: var(--abstand-xl) auto 0;
  font-size: clamp(1.125rem, 1.6vw, 1.4375rem);
  line-height: 1.05;
  text-align: center;
  text-wrap: balance;
}

.was-wir-tun__knopf {
  margin-top: clamp(2rem, 3.7vw, 3.3rem);
  text-align: center;
}

/* Zettel werden beim Hereinscrollen angeklebt, Tape kommt zuletzt */
:root.js .was-wir-tun__zettel:not(.ist-sichtbar),
:root.js .was-wir-tun__zettel:not(.ist-sichtbar) :deep(.klebeband) {
  opacity: 0;
}

.was-wir-tun__zettel.ist-sichtbar {
  animation: ankleben 0.7s cubic-bezier(0.22, 1.2, 0.36, 1) both;
}

.was-wir-tun__zettel.ist-sichtbar :deep(.klebeband) {
  animation: tape 0.35s ease-out 0.45s both;
}

@keyframes ankleben {
  from {
    opacity: 0;
    transform: rotate(calc(var(--drehung) + 7deg)) scale(1.12) translateY(-12px);
  }
}

@keyframes tape {
  from {
    opacity: 0;
    scale: 1.4;
  }
}

@media (min-width: 48rem) {
  .was-wir-tun__punkt {
    grid-template-columns: 8.875rem 1fr 21.25rem;
    min-height: clamp(8rem, 11.8vw, 10.625rem);
    padding-block: var(--abstand-s) calc(var(--abstand-s) + var(--strich-dicke));
  }

  .was-wir-tun__nummer {
    width: 8.875rem;
  }

  .was-wir-tun__punkttitel {
    max-width: 10em;
  }

  .was-wir-tun__zettel {
    grid-column: auto;
  }
}

@media (min-width: 48rem) and (max-width: 75rem) {
  .was-wir-tun__punkt {
    grid-template-columns: 9.9vw 1fr 29vw;
  }

  .was-wir-tun__nummer {
    width: auto;
  }
}
</style>
