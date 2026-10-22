<script setup lang="ts">
// Vereinsheim im Look der Website: lila Kopf mit Navigation, darunter cremefarbener Grund.
// Seiten mit `vollbreit: true` (Dashboard, Dorfanzeiger) bringen ihren eigenen Hintergrund mit.
const { ich } = useVereinsheimIch()
const { meldung } = useVereinsheimMeldung()
const route = useRoute()
useVereinsheimAppKopf()

interface Reiter { text: string, to: string }
const slug = (to: string) => to.split('/').pop() || 'dashboard'

const reiter = computed<Reiter[]>(() => [
  { text: 'Dashboard', to: '/vereinsheim' },
  { text: 'Termine', to: '/vereinsheim/termine' },
  { text: 'Dorfanzeiger', to: '/vereinsheim/dorfanzeiger' },
  { text: 'Kasse', to: '/vereinsheim/kassenbuch' },
  ...(ich.value?.vorstand ? [{ text: 'Post', to: '/vereinsheim/post' }] : []),
])
// seltener gebraucht: unter „Diverses“
const diverses = computed<Reiter[]>(() => [
  { text: 'Ideensammlung', to: '/vereinsheim/ideensammlung' },
  { text: 'Über uns', to: '/vereinsheim/ueber-uns' },
  ...(ich.value?.vorstand ? [{ text: 'Mitglieder', to: '/vereinsheim/mitglieder' }] : []),
])

const aktiv = (to: string) => (to === '/vereinsheim' ? route.path === to : route.path.startsWith(to))
const diversesAktiv = computed(() => diverses.value.some(r => aktiv(r.to)))
const vollbreit = computed(() => !!route.meta.vollbreit)

const menueOffen = ref(false)
const diversesOffen = ref(false)
const diversesEl = ref<HTMLElement | null>(null)
watch(() => route.fullPath, () => {
  menueOffen.value = false
  diversesOffen.value = false
})

// Untermenü schließen bei Klick daneben oder Escape
function draussen(e: Event) {
  if (diversesOffen.value && !diversesEl.value?.contains(e.target as Node)) diversesOffen.value = false
}
function escape(e: KeyboardEvent) {
  if (e.key === 'Escape' && diversesOffen.value) {
    diversesOffen.value = false
    diversesEl.value?.querySelector('button')?.focus()
  }
}
onMounted(() => {
  document.addEventListener('click', draussen)
  document.addEventListener('keydown', escape)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', draussen)
  document.removeEventListener('keydown', escape)
})
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
              <NuxtLink :to="r.to" class="vh__link" :data-tour="`nav-${r.to === '/vereinsheim/kassenbuch' ? 'kasse' : slug(r.to)}`" :aria-current="aktiv(r.to) ? 'page' : undefined">{{ r.text }}</NuxtLink>
            </li>
            <li ref="diversesEl" class="vh__diverses" data-tour="nav-diverses">
              <button
                type="button"
                class="vh__link vh__diverses-knopf"
                :class="{ 'vh__link--aktiv': diversesAktiv }"
                :aria-expanded="diversesOffen"
                aria-controls="vh-diverses"
                @click="diversesOffen = !diversesOffen"
              >
                Diverses <span class="vh__pfeil" aria-hidden="true">▾</span>
              </button>
              <ul id="vh-diverses" class="vh__untermenue" :class="{ 'vh__untermenue--offen': diversesOffen }">
                <li v-for="r in diverses" :key="r.to">
                  <NuxtLink :to="r.to" class="vh__unterlink" :aria-current="aktiv(r.to) ? 'page' : undefined">{{ r.text }}</NuxtLink>
                </li>
              </ul>
            </li>
          </ul>
          <div class="vh__person">
            <NuxtLink
              to="/vereinsheim/konto"
              class="vh__profil"
              data-tour="profil"
              title="Mein Profil"
              :aria-current="aktiv('/vereinsheim/konto') ? 'page' : undefined"
            >
              <img v-if="ich?.avatar" :src="vh.bild(ich.avatar, 96)" alt="" class="vh__avatar" width="36" height="36">
              <span v-else class="vh__avatar vh__avatar--leer" aria-hidden="true">
                <VereinsheimIcon name="konto" />
              </span>
              <span class="vh__profil-name"><span class="nur-screenreader">Mein Profil: </span>{{ ich?.first_name || ich?.benutzername || 'Profil' }}</span>
            </NuxtLink>
            <BasisKnopf to="/" variante="hell" groesse="klein">Tschüss</BasisKnopf>
          </div>
        </nav>
      </div>
    </header>

    <main id="inhalt" class="vh__inhalt" :class="{ 'vh__inhalt--vollbreit': vollbreit }" tabindex="-1">
      <slot />
    </main>

    <VereinsheimFuss />

    <VereinsheimTour />

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
.vh__link[aria-current='page'],
.vh__link--aktiv {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.3em;
}

.vh__diverses {
  position: relative;
}

.vh__diverses-knopf {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.vh__pfeil {
  display: inline-block;
  font-size: 0.8em;
  transition: rotate var(--dauer-kurz) ease;
}

[aria-expanded='true'] > .vh__pfeil {
  rotate: 180deg;
}

.vh__untermenue {
  position: absolute;
  top: calc(100% + 0.6rem);
  left: 50%;
  z-index: 25;
  display: none;
  min-width: 12rem;
  margin: 0;
  padding: 0.4rem;
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.25);
  list-style: none;
  translate: -50% 0;
}

.vh__untermenue--offen {
  display: block;
}

.vh__unterlink {
  display: block;
  padding: 0.55rem 0.8rem;
  border-radius: calc(var(--radius-m) - 2px);
  color: var(--farbe-schwarz);
  font-weight: var(--gewicht-text-normal);
  text-decoration: none;
}

.vh__unterlink:hover {
  background: var(--farbe-pfirsich);
}

.vh__unterlink[aria-current='page'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.vh__person {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--abstand-s);
}

/* Profil: rundes Bild (oder Symbol) + Vorname, führt zu „Mein Konto“ */
.vh__profil {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.8rem 0.2rem 0.2rem;
  border: 1.5px solid rgb(252 224 197 / 0.5);
  border-radius: 999px;
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
  text-decoration: none;
  transition: background-color var(--dauer-kurz) ease, border-color var(--dauer-kurz) ease;
}

.vh__profil:hover,
.vh__profil[aria-current='page'] {
  border-color: var(--farbe-pfirsich);
  background: rgb(252 224 197 / 0.15);
}

.vh__avatar {
  display: block;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
}

.vh__avatar--leer {
  display: grid;
  place-items: center;
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.vh__avatar--leer :deep(svg) {
  width: 1.5rem;
  height: 1.5rem;
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
  font-size: var(--groesse-s);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.4;
  animation: vh-rein var(--dauer-mittel) ease-out;
}

.vh__meldung--fehler {
  background: var(--farbe-pfirsich);
}

@keyframes vh-rein {
  from { opacity: 0; translate: 0 1rem; }
}

@media (max-width: 64rem) {
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

  /* mobil: Diverses als eingerückte Liste, immer offen */
  .vh__diverses-knopf {
    pointer-events: none;
  }

  .vh__pfeil {
    display: none;
  }

  .vh__untermenue {
    position: static;
    display: block;
    margin-top: 0.3rem;
    padding: 0 0 0 1rem;
    background: none;
    box-shadow: none;
    translate: none;
  }

  .vh__unterlink {
    padding: 0.2rem 0;
    color: var(--farbe-pfirsich);
    font-family: var(--schrift-display);
    font-weight: var(--gewicht-display);
    font-size: 1.25rem;
  }

  .vh__unterlink:hover,
  .vh__unterlink[aria-current='page'] {
    background: none;
    color: var(--farbe-pfirsich);
    text-decoration: underline;
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

<style>
/*
 * Arbeitsflächen im Vereinsheim: ruhiger als die Website. Durchgezogene, helle Rahmen statt
 * gestrichelter oranger Linien, Beschriftungen in Poppins. Gilt nur innerhalb von .vh.
 */
.vh {
  --vh-rand: #e4dccf;
  --vh-rand-stark: #c9bfb0;
  --vh-flaeche: var(--farbe-weiss);
  --vh-gedaempft: #6b6259;
  --vh-radius: 0.75rem;
  --vh-schatten: 0 1px 2px rgb(60 40 20 / 0.06), 0 4px 14px rgb(60 40 20 / 0.06);
}

.vh .feld .feld__label,
.vh .vh-label {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: var(--groesse-xs);
  letter-spacing: 0.01em;
  text-transform: none;
}

.vh .feld .feld__optional {
  color: var(--vh-gedaempft);
}

.vh .feld .feld__eingabe {
  min-height: 2.75rem;
  border: 1.5px solid var(--vh-rand-stark);
  border-radius: 0.6rem;
  background-color: var(--vh-flaeche);
  font-size: var(--groesse-s);
  transition: border-color var(--dauer-kurz) ease, box-shadow var(--dauer-kurz) ease;
}

.vh .feld .feld__eingabe:hover {
  border-color: #a99d8c;
}

.vh .feld .feld__eingabe:focus,
.vh .feld .feld__eingabe:focus-visible {
  border-color: var(--farbe-lila);
  outline: none;
  box-shadow: 0 0 0 3px rgb(122 42 126 / 0.18);
}

.vh .editor__feld--gross .feld__eingabe {
  min-height: 3.4rem;
  font-size: 1.35rem;
  font-weight: var(--gewicht-text-mittel);
}

.vh .feld .feld__auswahl {
  background-image: linear-gradient(45deg, transparent 50%, var(--farbe-lila) 50%), linear-gradient(-45deg, transparent 50%, var(--farbe-lila) 50%);
}

.vh .feld .feld__hinweis {
  color: var(--vh-gedaempft);
}

/* Seiteninhalt auf Inhaltsbreite (ohne Gewicht, Seiten können schmaler werden) */
:where(.vh__inhalt:not(.vh__inhalt--vollbreit)) > * {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

/* Karte: weiße Fläche mit hellem Rahmen – Grundbaustein der Unterseiten */
.vh-karte {
  padding: clamp(1rem, 2.5vw, 1.5rem);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--vh-flaeche);
  box-shadow: var(--vh-schatten);
}

.vh-karte__titel {
  margin: 0 0 var(--abstand-s);
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-fett);
  font-size: var(--groesse-s);
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--farbe-schwarz);
}

.vh-leer {
  margin: 0;
  padding: var(--abstand-l) var(--abstand-m);
  color: var(--vh-gedaempft);
  text-align: center;
}

/* kleine Text-Aktionen (Bearbeiten, Löschen …) */
.vh-aktion {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  font-weight: var(--gewicht-text-normal);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.vh-aktion--gefahr {
  color: #a1260d;
}
</style>
