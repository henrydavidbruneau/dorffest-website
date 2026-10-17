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
