<!-- Layout für private Seiten (Gastbeitrag): lila Grund, nur Logo + „zur Startseite“,
     keine Hauptnavigation; unten nur Impressum und Datenschutz. -->
<template>
  <div class="schlicht">
    <a href="#inhalt" class="schlicht__sprunglink">Zum Inhalt springen</a>
    <header class="schlicht__kopf">
      <NuxtLink to="/" class="schlicht__logo">
        <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen – zur Startseite" width="512" height="245">
      </NuxtLink>
      <NuxtLink to="/" class="schlicht__zurueck handlink">← zur Startseite</NuxtLink>
    </header>
    <main id="inhalt" tabindex="-1">
      <slot />
    </main>
    <footer class="schlicht__fuss">
      <NuxtLink to="/impressum">Impressum</NuxtLink>
      <NuxtLink to="/datenschutz">Datenschutz</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.schlicht {
  --farbe-fokus: var(--farbe-gelb);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--farbe-lila);
  color: var(--farbe-creme);
  overflow-x: clip;
}

.schlicht__sprunglink {
  position: absolute;
  top: -10rem;
  left: 1rem;
  z-index: 10;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  color: var(--farbe-lila);
}

.schlicht__sprunglink:focus {
  top: 1rem;
}

.schlicht__kopf {
  display: flex;
  gap: var(--abstand-m);
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: calc(80rem + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: clamp(0.9rem, 1.6vw, 1.4rem) var(--seitenrand);
}

.schlicht__logo img {
  width: clamp(5.5rem, 8vw, 7.5rem);
  height: auto;
}

.schlicht__zurueck {
  color: var(--farbe-pfirsich);
}

main {
  flex: 1;
  padding-bottom: clamp(3rem, 8vw, 6rem);
}

main:focus {
  outline: none;
}

.schlicht__fuss {
  display: flex;
  gap: var(--abstand-m);
  justify-content: center;
  padding: var(--abstand-m) var(--seitenrand) var(--abstand-l);
  font-size: var(--groesse-xs);
}

.schlicht__fuss a {
  color: var(--farbe-pfirsich);
}
</style>
