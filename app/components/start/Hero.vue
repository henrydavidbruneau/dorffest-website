<script setup lang="ts">
import { links } from '~/navigation'
import { texte } from '~/texte'

const t = texte.start.hero
</script>

<template>
  <section class="hero" aria-labelledby="hero-titel">
    <img
      src="/illustrationen/frau-mit-kind.svg"
      alt=""
      width="400"
      height="700"
      class="hero__figur"
    >

    <div class="hero__inhalt inhalt">
      <p class="hero__zusatz handschrift">
        {{ t.zusatz }}
        <span class="hero__stern" aria-hidden="true">✶</span>
      </p>
      <h1 id="hero-titel" class="hero__titel">
        Königsdorf<br>
        <BasisHervorhebung :drehung="-1.5">Rückt zusammen</BasisHervorhebung>
      </h1>
      <p class="hero__text">{{ t.text }}</p>
      <div class="hero__knoepfe">
        <BasisKnopf :to="links.infochannel" target="_blank">{{ t.knopfInfochannel }}</BasisKnopf>
        <BasisKnopf to="#was-wir-tun" variante="outline">{{ t.knopfWasWirTun }}</BasisKnopf>
      </div>
    </div>

    <div class="hero__wegweiser" aria-hidden="true">
      <span class="hero__hier-entlang handschrift">{{ t.hierEntlang }}</span>
      <svg class="hero__pfeil" viewBox="0 0 600 220" preserveAspectRatio="none">
        <path
          d="M560 10 C 560 120, 420 190, 260 170 S 40 150, 10 210"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-dasharray="7 9"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <img
      src="/illustrationen/tanzpaar.svg"
      alt=""
      width="700"
      height="700"
      class="hero__tanzpaar"
      loading="lazy"
    >
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding-block: var(--abstand-xl) var(--abstand-l);
  text-align: center;
}

.hero__inhalt {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero__figur {
  position: absolute;
  top: 0;
  left: max(var(--seitenrand), calc(50% - 40rem));
  width: clamp(4rem, 2rem + 6vw, 8.5rem);
}

.hero__zusatz {
  position: relative;
  margin: 0 0 var(--abstand-2xs);
  font-size: clamp(1.6rem, 1.2rem + 1.5vw, 2.4rem);
  color: var(--farbe-orange);
  transform: translateX(15%) rotate(-3deg);
}

.hero__stern {
  position: absolute;
  bottom: -1.1em;
  left: 50%;
  font-family: var(--schrift-text);
  font-size: 0.6em;
}

.hero__titel {
  font-size: clamp(3.25rem, 1rem + 9vw, 9.5rem);
  line-height: 0.88;
}

.hero__titel :deep(.hervorhebung) {
  margin-top: 0.06em;
  padding-inline: 0.12em;
}

.hero__text {
  max-width: 34rem;
  margin: var(--abstand-m) auto var(--abstand-m);
  font-size: var(--groesse-s);
}

.hero__knoepfe {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--abstand-xs);
}

.hero__wegweiser {
  display: none;
}

.hero__tanzpaar {
  width: clamp(6rem, 4rem + 6vw, 10rem);
  margin: var(--abstand-l) auto 0;
}

@media (min-width: 64rem) {
  .hero {
    padding-bottom: var(--abstand-2xl);
  }

  .hero__wegweiser {
    position: absolute;
    right: max(var(--seitenrand), calc(50% - 38rem));
    bottom: 0;
    display: block;
    width: min(46vw, 40rem);
    height: 15rem;
    color: var(--farbe-orange);
  }

  .hero__hier-entlang {
    position: absolute;
    top: -2.2rem;
    right: -0.5rem;
    font-size: 2rem;
    transform: rotate(-18deg);
  }

  .hero__pfeil {
    width: 100%;
    height: 100%;
  }

  .hero__tanzpaar {
    position: absolute;
    bottom: 1.5rem;
    left: max(var(--seitenrand), calc(50% - 30rem));
    margin: 0;
  }
}
</style>
