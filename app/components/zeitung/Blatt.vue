<script setup lang="ts">
// Das Zeitungsblatt: cremefarbenes Papier mit zwei Tape-Streifen.
// Beim Laden faltet es sich auf (CSS-Animation, entfällt bei prefers-reduced-motion).
</script>

<template>
  <div class="blatt-buehne">
    <article class="blatt">
      <BasisKlebeband position="links" farbe="gelb" :drehung="-3" :breite="6" class="blatt__tape-links" />
      <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" class="blatt__tape-rechts" />
      <slot />
      <span class="blatt__falz" aria-hidden="true" />
    </article>
  </div>
</template>

<style scoped>
/* Design: Blatt 1108 breit, 56px Innenrand, minimal gedreht */
.blatt-buehne {
  max-width: calc(69.25rem + 2 * var(--seitenrand));
  margin: clamp(2rem, 4.5vw, 4rem) auto 0;
  padding-inline: var(--seitenrand);
  perspective: 2200px;
}

.blatt {
  position: relative;
  padding: clamp(1.25rem, 3.9vw, 3.5rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-zeitungspapier);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
  transform: rotate(-0.3deg);
  transform-origin: 50% 0;
  animation: aufklappen 1.3s cubic-bezier(0.22, 0.9, 0.25, 1) both;
}

.blatt__tape-links {
  left: 8% !important;
  top: -0.6rem !important;
}

.blatt__tape-rechts {
  right: 8% !important;
  top: -0.6rem !important;
}

/* Falzlinien: senkrecht in der Mitte und waagerecht – verblassen nach dem Auffalten */
.blatt__falz {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(90deg, transparent calc(50% - 14px), rgb(0 0 0 / 0.07) 50%, transparent calc(50% + 14px)),
    linear-gradient(180deg, transparent calc(30vh - 12px), rgb(0 0 0 / 0.08) 30vh, transparent calc(30vh + 12px));
  pointer-events: none;
  animation: falz-verblassen 1.9s ease-out both;
}

/* Erst kommt das gefaltete Blatt angeflogen, dann klappt es nach unten auf und federt nach */
@keyframes aufklappen {
  0% {
    opacity: 0;
    transform: translateY(40px) rotateX(-82deg) scale(0.55) rotate(-4deg);
  }

  18% {
    opacity: 1;
  }

  55% {
    transform: translateY(0) rotateX(14deg) scale(0.96) rotate(-1deg);
  }

  78% {
    transform: rotateX(-4deg) scale(1) rotate(-0.4deg);
  }

  100% {
    transform: rotateX(0) scale(1) rotate(-0.3deg);
  }
}

@keyframes falz-verblassen {
  0%,
  45% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .blatt,
  .blatt__falz {
    animation: none;
  }

  .blatt__falz {
    opacity: 0;
  }
}
</style>
