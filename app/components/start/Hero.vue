<script setup lang="ts">
import { links } from '~/navigation'
import { texte } from '~/texte'

const t = texte.start.hero
</script>

<template>
  <!-- Der Pfeil zur nächsten Sektion und das Tanzpaar zeichnet <StartWegweiser> -->
  <section class="hero" aria-labelledby="hero-titel">
    <img
      src="/illustrationen/frau-mit-kind.svg"
      alt=""
      width="400"
      height="700"
      class="hero__figur"
    >

    <div class="hero__inhalt inhalt">
      <p class="hero__zusatz handschrift">{{ t.zusatz }}</p>
      <span class="hero__stern" aria-hidden="true">✶</span>
      <h1 id="hero-titel" class="hero__titel">
        <span class="hero__zeile1">Königsdorf</span>
        <BasisHervorhebung :drehung="-1" class="hero__zeile2">Rückt zusammen</BasisHervorhebung>
      </h1>
      <p class="hero__text">{{ t.text }}</p>
      <div class="hero__knoepfe">
        <BasisKnopf :to="links.infochannel" target="_blank">{{ t.knopfInfochannel }}</BasisKnopf>
        <BasisKnopf id="knopf-was-wir-tun" to="#was-wir-tun" variante="outline">{{ t.knopfWasWirTun }}</BasisKnopf>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- Aufbau-Animation (Zeiten in s nach dem Laden; Navigation 0.1–0.9) ---------- */
.hero__figur,
.hero__zusatz,
.hero__stern,
.hero__zeile1,
.hero__zeile2,
.hero__text,
.hero__knoepfe > * {
  animation-duration: 0.8s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  animation-fill-mode: both;
}

.hero__figur {
  animation-name: von-links;
  animation-delay: 0.45s;
  animation-duration: 1s;
}

.hero__zusatz {
  animation-name: handschrift-rein;
  animation-delay: 0.55s;
}

.hero__stern {
  animation-name: ploppen;
  animation-delay: 0.85s;
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.34, 1.7, 0.5, 1);
}

.hero__zeile1 {
  animation-name: aufsteigen;
  animation-delay: 0.65s;
}

/* Flieder-Kasten wischt von links auf */
.hero__zeile2 {
  animation-name: wischen;
  animation-delay: 0.95s;
  animation-duration: 0.9s;
  animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
}

.hero__text {
  animation-name: aufsteigen;
  animation-delay: 1.35s;
}

.hero__knoepfe > :nth-child(1) {
  animation-name: aufsteigen;
  animation-delay: 1.55s;
}

.hero__knoepfe > :nth-child(2) {
  animation-name: aufsteigen;
  animation-delay: 1.68s;
}

@keyframes aufsteigen {
  from {
    opacity: 0;
    translate: 0 1.5rem;
  }
}

@keyframes von-links {
  from {
    opacity: 0;
    translate: -2.5rem 0.5rem;
    rotate: -8deg;
  }
}

@keyframes handschrift-rein {
  from {
    opacity: 0;
    translate: 0 0.75rem;
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 -10% 0 0);
  }
}

@keyframes ploppen {
  from {
    opacity: 0;
    scale: 0;
    rotate: -90deg;
  }
}

@keyframes wischen {
  from {
    clip-path: inset(-10% 100% -10% 0);
  }

  to {
    clip-path: inset(-10% -2% -10% 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__figur,
  .hero__zusatz,
  .hero__stern,
  .hero__zeile1,
  .hero__zeile2,
  .hero__text,
  .hero__knoepfe > * {
    animation: none;
  }
}

/* Maße aus dem Design (1440): Inhalt beginnt 74px unter der Nav-Linie */
.hero {
  position: relative;
  min-height: calc(100svh - var(--kopf-hoehe));
  padding-block: clamp(2.5rem, 5.1vw, 4.625rem) clamp(4rem, 9vw, 8rem);
  text-align: center;
}

.hero__inhalt {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Frau mit Kind: 64px links vom Inhaltsrand, 56px unter der Linie, 117 breit */
.hero__figur {
  position: absolute;
  top: clamp(1.5rem, 3.9vw, 3.5rem);
  left: max(0.5rem, calc(50% - min(35rem, 50vw - var(--seitenrand)) - clamp(0rem, 4.4vw, 4rem)));
  width: clamp(3.5rem, 8.1vw, 7.3rem);
}

.hero__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-xl);
  line-height: 1;
  color: var(--farbe-orange);
  transform: rotate(-3deg);
}

.hero__stern {
  display: inline-block;
  margin-top: 0.15rem;
  font-size: clamp(1.25rem, 2.1vw, 1.9rem);
  line-height: 1;
  color: var(--farbe-orange);
}

.hero__titel {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.1rem;
}

.hero__zeile1 {
  font-size: var(--groesse-h1);
  line-height: 0.8;
}

.hero__zeile2 {
  margin-top: clamp(0.15rem, 0.4vw, 0.4rem);
  padding: 0.2em 0.14em 0.17em;
  font-size: var(--groesse-h1-gross);
  line-height: 0.85;
  white-space: nowrap;
}

.hero__text {
  max-width: 39rem;
  margin: clamp(0.75rem, 1.4vw, 1.25rem) auto 0;
  font-size: clamp(1.0625rem, 1.354vw, 1.21875rem); /* 19,5 */
  line-height: 1.6;
}

.hero__knoepfe {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--abstand-s);
  margin-top: clamp(2rem, 4.2vw, 3.75rem);
}

@media (max-width: 40rem) {
  .hero__zeile2 {
    white-space: normal;
  }
}
</style>
