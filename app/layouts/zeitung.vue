<!-- Layout für den Dorfanzeiger: Zeitungsblatt auf lila Grund, ohne Kopf und Fuß der Seite -->
<template>
  <div class="zeitung-layout">
    <a href="#inhalt" class="zeitung-layout__sprunglink">Zum Inhalt springen</a>
    <div class="zeitung-layout__oben">
      <NuxtLink to="/" class="zeitung-layout__zurueck">
        <span aria-hidden="true">←</span> Zurück zur Startseite
      </NuxtLink>
    </div>
    <main id="inhalt" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.zeitung-layout {
  --farbe-fokus: var(--farbe-gelb);
  min-height: 100vh;
  padding-bottom: clamp(3rem, 8vw, 8rem);
  background: var(--farbe-lila);
  overflow-x: clip;
}

.zeitung-layout__sprunglink {
  position: absolute;
  top: var(--abstand-2xs);
  left: var(--abstand-2xs);
  z-index: 20;
  padding: var(--abstand-2xs) var(--abstand-s);
  background: var(--farbe-gelb);
  color: var(--farbe-schwarz);
  transform: translateY(-200%);
}

.zeitung-layout__sprunglink:focus {
  transform: none;
}

/* Design: Link bei x=187, y=70 – über der linken Blattkante */
.zeitung-layout__oben {
  max-width: calc(69.25rem + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: clamp(2rem, 4.6vw, 4.1rem) calc(var(--seitenrand) + clamp(0rem, 1.4vw, 1.3rem)) 0;
}

.zeitung-layout__zurueck {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.25rem, 2.08vw, 1.875rem);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-creme);
}

.zeitung-layout__zurueck:hover {
  text-decoration: underline;
}

main:focus {
  outline: none;
}
</style>
