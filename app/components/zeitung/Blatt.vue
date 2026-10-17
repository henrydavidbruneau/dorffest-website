<script setup lang="ts">
// Das Zeitungsblatt: cremefarbenes Papier mit zwei Tape-Streifen.
// Beim Laden gleitet es von unten rechts in einer leichten Kurve herein
// (entfällt bei prefers-reduced-motion).
withDefaults(
  defineProps<{
    /** voll = Übersicht, schmal = Artikelseite */
    breite?: 'voll' | 'schmal'
  }>(),
  { breite: 'voll' },
)
</script>

<template>
  <div class="blatt-buehne" :class="`blatt-buehne--${breite}`">
    <!-- zwei Ebenen: x und y laufen mit unterschiedlichem Easing → gebogene Flugbahn -->
    <div class="blatt-flug-x">
      <div class="blatt-flug-y">
        <article class="blatt">
          <BasisKlebeband position="links" farbe="gelb" :drehung="-3" :breite="6" class="blatt__tape-links" />
          <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" class="blatt__tape-rechts" />
          <slot />
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Design: Blatt 1108 breit, 56px Innenrand, minimal gedreht */
.blatt-buehne {
  --dauer: 1.1s;
  max-width: calc(69.25rem + 2 * var(--seitenrand));
  margin: clamp(2rem, 4.5vw, 4rem) auto 0;
  padding-inline: var(--seitenrand);
}

.blatt-buehne--schmal {
  max-width: calc(52rem + 2 * var(--seitenrand));
}

/* waagerecht: zieht früh nach links (stark abbremsend) */
.blatt-flug-x {
  animation: flug-x var(--dauer) cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* senkrecht: steigt gleichmäßiger und setzt sanft auf; dazu dreht sich das Blatt gerade */
.blatt-flug-y {
  animation: flug-y var(--dauer) cubic-bezier(0.33, 0.9, 0.35, 1) both;
}

.blatt {
  position: relative;
  padding: clamp(1.25rem, 3.9vw, 3.5rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-zeitungspapier);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
  transform: rotate(-0.3deg);
}

.blatt-buehne--schmal .blatt {
  padding: clamp(1.25rem, 3.3vw, 3rem);
}

.blatt__tape-links {
  left: 8% !important;
  top: -0.6rem !important;
}

.blatt__tape-rechts {
  right: 8% !important;
  top: -0.6rem !important;
}

@keyframes flug-x {
  from {
    transform: translateX(14vw);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes flug-y {
  from {
    opacity: 0;
    transform: translateY(70vh) rotate(7deg);
  }

  25% {
    opacity: 1;
  }

  to {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blatt-flug-x,
  .blatt-flug-y {
    animation: none;
  }
}
</style>
