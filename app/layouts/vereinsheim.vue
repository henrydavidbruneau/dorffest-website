<script setup lang="ts">
// Vereinsheim im Look der Website: lila Kopf mit Navigation, darunter cremefarbener Grund.
// Seiten mit `vollbreit: true` (Dashboard, Dorfanzeiger) bringen ihren eigenen Hintergrund mit.
const { ich } = useVereinsheimIch()
const { meldung } = useVereinsheimMeldung()
const route = useRoute()

const reiter = computed(() => [
  { text: 'Dashboard', to: '/vereinsheim' },
  { text: 'Termine', to: '/vereinsheim/termine' },
  { text: 'Dorfanzeiger', to: '/vereinsheim/dorfanzeiger' },
  { text: 'Ideensammlung', to: '/vereinsheim/ideensammlung' },
  { text: 'Über uns', to: '/vereinsheim/ueber-uns' },
  { text: 'Kasse', to: '/vereinsheim/kassenbuch' },
  ...(ich.value?.vorstand ? [{ text: 'Mitglieder', to: '/vereinsheim/mitglieder' }] : []),
])

const aktiv = (to: string) => (to === '/vereinsheim' ? route.path === to : route.path.startsWith(to))
const vollbreit = computed(() => !!route.meta.vollbreit)

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
    <header class="vh__kopf">
      <div class="vh__leiste">
        <NuxtLink to="/vereinsheim" class="vh__marke">
          <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen" width="512" height="245" class="vh__logo">
          <span class="vh__heim handschrift">Vereinsheim</span>
        </NuxtLink>

        <button type="button" class="vh__menueknopf" :aria-expanded="menueOffen" aria-controls="vh-nav" @click="menueOffen = !menueOffen">
          {{ menueOffen ? 'Zu' : 'Menü' }}
        </button>

        <nav id="vh-nav" class="vh__nav" :class="{ 'vh__nav--offen': menueOffen }" aria-label="Vereinsheim">
          <ul class="vh__liste">
            <li v-for="r in reiter" :key="r.to">
              <NuxtLink :to="r.to" class="vh__link" :aria-current="aktiv(r.to) ? 'page' : undefined">{{ r.text }}</NuxtLink>
            </li>
          </ul>
          <div class="vh__person">
            <NuxtLink to="/vereinsheim/konto" class="vh__name handschrift" :aria-current="aktiv('/vereinsheim/konto') ? 'page' : undefined">
              {{ ich?.first_name || ich?.benutzername || 'Mein Konto' }}
            </NuxtLink>
            <BasisKnopf variante="hell" groesse="klein" @click="abmelden">Tschüss</BasisKnopf>
          </div>
        </nav>
      </div>
    </header>

    <main id="inhalt" class="vh__inhalt" :class="{ 'vh__inhalt--vollbreit': vollbreit }" tabindex="-1">
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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--farbe-creme);
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

/* ---------- Kopf ---------- */
.vh__kopf {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
  color: var(--farbe-pfirsich);
}

.vh__leiste {
  display: flex;
  align-items: center;
  gap: var(--abstand-s) var(--abstand-l);
  max-width: calc(var(--inhaltsbreite) + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-m) var(--seitenrand);
}

.vh__marke {
  display: flex;
  align-items: flex-end;
  gap: var(--abstand-xs);
  text-decoration: none;
}

.vh__logo {
  width: clamp(5.5rem, 8vw, 7.5rem);
  height: auto;
}

.vh__heim {
  margin-bottom: -0.4rem;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-pfirsich);
  rotate: -4deg;
}

.vh__menueknopf {
  display: none;
}

.vh__nav {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-m);
}

.vh__liste {
  display: flex;
  gap: 0.3rem clamp(0.7rem, 1.2vw, 1.25rem);
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

.vh__link {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.1rem;
  color: var(--farbe-pfirsich);
  text-decoration: none;
  white-space: nowrap;
}

.vh__link:hover,
.vh__link[aria-current='page'] {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.3em;
}

.vh__person {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--abstand-s);
}

.vh__name {
  font-size: var(--groesse-hand-m);
  color: var(--farbe-pfirsich);
  text-decoration: none;
}

.vh__name:hover {
  text-decoration: underline;
}

/* ---------- Inhalt ---------- */
.vh__inhalt {
  flex: 1;
  padding: var(--abstand-xl) var(--seitenrand);
}

.vh__inhalt--vollbreit {
  padding: 0;
}

.vh__inhalt:focus {
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

@media (max-width: 80rem) {
  .vh__menueknopf {
    display: block;
    margin-left: auto;
    padding: 0.4rem 0.9rem;
    border: 1.5px solid var(--farbe-pfirsich);
    border-radius: var(--radius-m);
    background: transparent;
    color: var(--farbe-pfirsich);
    font: inherit;
  }

  .vh__leiste {
    flex-wrap: wrap;
  }

  .vh__nav {
    display: none;
    flex-basis: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .vh__nav--offen {
    display: flex;
  }

  .vh__liste {
    flex-direction: column;
    margin: 0;
  }

  .vh__link {
    font-size: 1.5rem;
  }
}

@media print {
  .vh__kopf,
  .vh__meldung-ort {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vh__meldung {
    animation: none;
  }
}
</style>
