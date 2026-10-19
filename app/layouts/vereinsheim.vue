<script setup lang="ts">
// Vereinsheim: Holzleiste mit Schild oben, Karteireiter als Navigation, darunter die Korkwand.
const { ich } = useVereinsheimIch()
const { meldung } = useVereinsheimMeldung()
const route = useRoute()

const reiter = computed(() => [
  { text: 'Schwarzes Brett', to: '/vereinsheim' },
  { text: 'Termine', to: '/vereinsheim/termine' },
  { text: 'Dorfanzeiger', to: '/vereinsheim/dorfanzeiger' },
  { text: 'Mitmachen', to: '/vereinsheim/mitmachen' },
  { text: 'Über uns', to: '/vereinsheim/ueber-uns' },
  { text: 'Kassenbuch', to: '/vereinsheim/kassenbuch' },
  ...(ich.value?.vorstand ? [{ text: 'Mitglieder', to: '/vereinsheim/mitglieder' }] : []),
])

const aktiv = (to: string) => (to === '/vereinsheim' ? route.path === to : route.path.startsWith(to))

const menueOffen = ref(false)
watch(() => route.fullPath, () => (menueOffen.value = false))

async function abmelden() {
  await $fetch('/api/vereinsheim/logout', { method: 'POST' }).catch(() => {})
  ich.value = null
  await navigateTo('/vereinsheim/tuer?tschuess=1')
}
</script>

<template>
  <div class="vh">
    <a href="#inhalt" class="vh__sprunglink">Zum Inhalt springen</a>
    <header class="vh__leiste">
      <div class="vh__leiste-innen">
        <NuxtLink to="/vereinsheim" class="vh__schild">
          <img src="/logo-mobil.svg" alt="" width="512" height="245" class="vh__logo">
          <span class="vh__schild-text">Vereinsheim</span>
        </NuxtLink>
        <div class="vh__person">
          <NuxtLink to="/vereinsheim/konto" class="vh__konto">{{ ich?.first_name || ich?.benutzername || 'Mein Konto' }}</NuxtLink>
          <button type="button" class="vh__raus" @click="abmelden">Tschüss&nbsp;👋</button>
          <NuxtLink to="/" class="vh__website">zur Website</NuxtLink>
        </div>
        <button type="button" class="vh__menue-knopf" :aria-expanded="menueOffen" aria-controls="vh-reiter" @click="menueOffen = !menueOffen">
          {{ menueOffen ? 'Zu' : 'Menü' }}
        </button>
      </div>
      <nav id="vh-reiter" class="vh__reiter" :class="{ 'vh__reiter--offen': menueOffen }" aria-label="Vereinsheim">
        <NuxtLink
          v-for="r in reiter"
          :key="r.to"
          :to="r.to"
          class="vh__reiter-link"
          :aria-current="aktiv(r.to) ? 'page' : undefined"
        >
          {{ r.text }}
        </NuxtLink>
        <div class="vh__reiter-extra">
          <NuxtLink to="/vereinsheim/konto" class="vh__reiter-link">Mein Konto</NuxtLink>
          <button type="button" class="vh__reiter-link" @click="abmelden">Tschüss 👋</button>
          <NuxtLink to="/" class="vh__reiter-link">zur Website</NuxtLink>
        </div>
      </nav>
    </header>

    <main id="inhalt" class="vh__wand" tabindex="-1">
      <slot />
    </main>

    <div class="vh__meldung-ort" aria-live="polite">
      <p v-if="meldung" :key="meldung.nr" class="vh__meldung" :class="`vh__meldung--${meldung.art}`" :role="meldung.art === 'fehler' ? 'alert' : 'status'">
        {{ meldung.text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.vh {
  /* Holz und Kork nur im Vereinsheim */
  --holz: #6e4526;
  --holz-hell: #8a5a33;
  --kork: #c79d6c;
  --kork-dunkel: #b0844f;
  --farbe-fokus: var(--farbe-lila);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--kork);
  overflow-x: clip;
}

.vh__sprunglink {
  position: absolute;
  top: -10rem;
  left: 1rem;
  z-index: 20;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
}

.vh__sprunglink:focus {
  top: 1rem;
}

/* ---------- Holzleiste ---------- */
.vh__leiste {
  --farbe-fokus: var(--farbe-gelb);
  position: relative;
  z-index: 2;
  background:
    repeating-linear-gradient(90deg, rgb(0 0 0 / 0.04) 0 2px, transparent 2px 9px),
    linear-gradient(180deg, var(--holz-hell), var(--holz));
  color: var(--farbe-creme);
  box-shadow: 0 4px 10px rgb(0 0 0 / 0.25);
}

.vh__leiste-innen {
  display: flex;
  align-items: center;
  gap: var(--abstand-m);
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
  padding: var(--abstand-s) var(--seitenrand) var(--abstand-2xs);
}

.vh__schild {
  display: inline-flex;
  align-items: center;
  gap: var(--abstand-xs);
  padding: 0.4rem 0.9rem 0.4rem 0.5rem;
  border: 2px solid var(--farbe-schwarz);
  border-radius: var(--radius-m);
  background: var(--farbe-gelb);
  color: var(--farbe-schwarz);
  text-decoration: none;
  box-shadow: 3px 3px 0 rgb(0 0 0 / 0.35);
  rotate: -1.5deg;
}

.vh__logo {
  width: 4.5rem;
  height: auto;
}

.vh__schild-text {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  text-transform: uppercase;
  line-height: 1;
}

.vh__person {
  display: flex;
  align-items: center;
  gap: var(--abstand-s);
  margin-left: auto;
  font-size: var(--groesse-xs);
}

.vh__konto,
.vh__website {
  color: var(--farbe-creme);
}

.vh__konto {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  text-decoration: none;
}

.vh__raus {
  padding: 0.3rem 0.8rem;
  border: 1.5px solid var(--farbe-creme);
  border-radius: var(--radius-m);
  background: transparent;
  color: var(--farbe-creme);
  font: inherit;
  cursor: pointer;
}

.vh__raus:hover {
  background: rgb(255 255 255 / 0.12);
}

.vh__menue-knopf,
.vh__reiter-extra {
  display: none;
}

/* ---------- Karteireiter ---------- */
.vh__reiter {
  display: flex;
  gap: 0.3rem;
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
  padding: var(--abstand-2xs) var(--seitenrand) 0;
  overflow-x: auto;
}

.vh__reiter-link {
  flex: none;
  padding: 0.55rem 1rem 0.5rem;
  border: 1.5px solid var(--farbe-schwarz);
  border-bottom: 0;
  border-radius: 0.6rem 0.6rem 0 0;
  background: var(--farbe-pfirsich);
  color: var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-decoration: none;
  translate: 0 0.25rem;
  transition: translate var(--dauer-kurz);
}

.vh__reiter-link:nth-child(3n + 2) {
  background: var(--farbe-gelb);
}

.vh__reiter-link:nth-child(3n) {
  background: var(--farbe-tape-flieder);
}

.vh__reiter-link:hover {
  translate: 0 0;
}

.vh__reiter-link[aria-current='page'] {
  background: var(--farbe-creme);
  translate: 0 0;
  box-shadow: 0 -2px 0 var(--farbe-orange) inset;
}

/* ---------- Korkwand ---------- */
.vh__wand {
  flex: 1;
  padding: var(--abstand-l) var(--seitenrand) var(--abstand-xl);
  /* Korkkörnung: zwei versetzte Punktraster + leichte Wolken */
  background-color: var(--kork);
  background-image:
    radial-gradient(circle at 20% 30%, var(--kork-dunkel) 0 1px, transparent 1.5px),
    radial-gradient(circle at 70% 80%, rgb(255 255 255 / 0.18) 0 1px, transparent 1.5px),
    radial-gradient(ellipse at 30% 10%, rgb(255 255 255 / 0.12), transparent 60%),
    radial-gradient(ellipse at 80% 90%, rgb(0 0 0 / 0.1), transparent 55%);
  background-size: 7px 7px, 11px 11px, 100% 100%, 100% 100%;
}

.vh__wand:focus {
  outline: none;
}

/* ---------- Rückmeldung ---------- */
.vh__meldung-ort {
  position: fixed;
  bottom: var(--abstand-m);
  left: 50%;
  z-index: 30;
  translate: -50% 0;
  pointer-events: none;
}

.vh__meldung {
  margin: 0;
  padding: 0.7rem 1.2rem;
  border: 2px solid var(--farbe-schwarz);
  border-radius: var(--radius-m);
  background: var(--farbe-gelb);
  box-shadow: var(--schatten-karte);
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-m);
  line-height: 1.1;
  rotate: -1deg;
  animation: vh-rein var(--dauer-mittel) ease-out;
}

.vh__meldung--fehler {
  background: var(--farbe-pfirsich);
  font-family: var(--schrift-text);
  font-size: var(--groesse-s);
}

@keyframes vh-rein {
  from { opacity: 0; translate: 0 1rem; }
}

@media (max-width: 760px) {
  .vh__person {
    display: none;
  }

  .vh__menue-knopf {
    display: block;
    margin-left: auto;
    padding: 0.4rem 0.9rem;
    border: 1.5px solid var(--farbe-creme);
    border-radius: var(--radius-m);
    background: transparent;
    color: var(--farbe-creme);
    font: inherit;
  }

  .vh__reiter {
    display: none;
    flex-direction: column;
    padding-bottom: var(--abstand-s);
  }

  .vh__reiter--offen,
  .vh__reiter-extra {
    display: flex;
  }

  .vh__reiter-extra {
    flex-direction: column;
    gap: 0.3rem;
    margin-top: var(--abstand-2xs);
  }

  button.vh__reiter-link {
    font: inherit;
    font-family: var(--schrift-display);
    text-align: left;
    cursor: pointer;
  }

  .vh__reiter-link {
    border-bottom: 1.5px solid var(--farbe-schwarz);
    border-radius: var(--radius-m);
    translate: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vh__meldung {
    animation: none;
  }
}
</style>
