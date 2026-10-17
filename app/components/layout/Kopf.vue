<script setup lang="ts">
import { hauptnavigation, links } from '~/navigation'

withDefaults(defineProps<{
  /** Leiste fährt beim Laden von oben herein */
  einfahren?: boolean
  /** lila Farbschema von Anfang an (auf lila Seitengrund, z.B. Dorfanzeiger) */
  dunkel?: boolean
}>(), { einfahren: false, dunkel: false })

const menueOffen = ref(false)
const gescrollt = ref(false)
const route = useRoute()

function scrollPruefen() {
  gescrollt.value = window.scrollY > 40
}

onMounted(() => {
  scrollPruefen()
  window.addEventListener('scroll', scrollPruefen, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scrollPruefen)
})

watch(() => route.fullPath, () => {
  menueOffen.value = false
})

function aktiv(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <!-- Platzhalter in Kopfhöhe: Der Kopf ist fixiert und darf beim Schrumpfen nichts verschieben -->
  <div class="kopf-platz" aria-hidden="true" />
  <header class="kopf" :class="{ 'kopf--gescrollt': gescrollt, 'kopf--einfahren': einfahren, 'kopf--dunkel': dunkel }">
    <a href="#inhalt" class="kopf__sprunglink">Zum Inhalt springen</a>
    <div class="kopf__leiste">
      <NuxtLink to="/" class="kopf__logo">
        <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen – zur Startseite" width="512" height="245">
      </NuxtLink>

      <button
        type="button"
        class="kopf__menueknopf"
        :aria-expanded="menueOffen"
        aria-controls="hauptnavigation"
        @click="menueOffen = !menueOffen"
      >
        <span class="kopf__burger" :class="{ 'kopf__burger--offen': menueOffen }" aria-hidden="true" />
        <span class="nur-screenreader">Menü</span>
      </button>

      <nav id="hauptnavigation" class="kopf__nav" :class="{ 'kopf__nav--offen': menueOffen }" aria-label="Hauptnavigation">
        <ul class="kopf__liste">
          <li v-for="link in hauptnavigation" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="kopf__link"
              :class="{ 'kopf__link--aktiv': aktiv(link.to) }"
              :aria-current="aktiv(link.to) ? 'page' : undefined"
            >
              {{ link.text }}
            </NuxtLink>
          </li>
        </ul>
        <BasisKnopf
          :to="links.mitmachen"
          :variante="gescrollt || dunkel ? 'hell' : 'gefuellt'"
          groesse="klein"
          class="kopf__mitmachen"
        >
          Mitmachen
        </BasisKnopf>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.kopf-platz {
  height: var(--kopf-hoehe);
}

.kopf {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  background: var(--farbe-creme);
  transition:
    background-color var(--dauer-mittel) ease,
    box-shadow var(--dauer-mittel) ease;
}

/* von oben hereinfahren (Dorfanzeiger) */
.kopf--einfahren {
  animation: einfahren 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

@keyframes einfahren {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kopf--einfahren {
    animation: none;
  }
}

/* beim Scrollen: kompakter und lila */
.kopf--dunkel {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
}

.kopf--gescrollt {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.15);
}

.kopf__sprunglink {
  position: absolute;
  top: var(--abstand-2xs);
  left: var(--abstand-2xs);
  z-index: 20;
  padding: var(--abstand-2xs) var(--abstand-s);
  background: var(--farbe-lila);
  color: var(--farbe-weiss);
  transform: translateY(-200%);
}

.kopf__sprunglink:focus {
  transform: none;
}

/* Leiste 1160 breit (120–1280 bei 1440) */
.kopf__leiste {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-m);
  max-width: calc(72.5rem + 2 * var(--seitenrand));
  height: var(--kopf-hoehe);
  margin-inline: auto;
  padding-inline: var(--seitenrand);
  transition: height var(--dauer-mittel) ease;
}

.kopf--gescrollt .kopf__leiste {
  height: 4.25rem;
}

.kopf__logo img {
  width: clamp(4.75rem, 9.3vw, 8.375rem);
  transition: width var(--dauer-mittel) ease;
}

.kopf--gescrollt .kopf__logo img {
  width: clamp(4rem, 5vw, 4.75rem);
}

.kopf__liste {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.kopf__link {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.25rem;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.kopf--gescrollt .kopf__link,
.kopf--dunkel .kopf__link {
  color: var(--farbe-pfirsich);
}

.kopf__link:hover,
.kopf__link--aktiv {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.3em;
}

/* ---------- Desktop ---------- */
@media (min-width: 56rem) {
  .kopf__menueknopf {
    display: none;
  }

  .kopf__nav {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: var(--abstand-m);
  }

  .kopf__liste {
    flex: 1;
    justify-content: center;
    gap: clamp(1.5rem, 3vw, 2.5rem);
  }
}

/* ---------- Mobil ---------- */
@media (max-width: 55.99rem) {
  .kopf__menueknopf {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  .kopf__burger,
  .kopf__burger::before,
  .kopf__burger::after {
    display: block;
    width: 1.75rem;
    height: 3px;
    border-radius: 2px;
    background: var(--farbe-lila);
    transition: transform var(--dauer-mittel) ease, background-color var(--dauer-mittel) ease;
  }

  .kopf__burger {
    position: relative;
  }

  .kopf__burger::before,
  .kopf__burger::after {
    content: '';
    position: absolute;
    left: 0;
  }

  .kopf__burger::before {
    top: -9px;
  }

  .kopf__burger::after {
    top: 9px;
  }

  .kopf__burger--offen {
    background: transparent;
  }

  .kopf__burger--offen::before {
    transform: translateY(9px) rotate(45deg);
  }

  .kopf__burger--offen::after {
    transform: translateY(-9px) rotate(-45deg);
  }

  .kopf__nav {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--abstand-m);
    padding: var(--abstand-m) var(--seitenrand) var(--abstand-l);
    background: var(--farbe-creme);
    box-shadow: 0 8px 14px rgb(0 0 0 / 0.12);
  }

  .kopf__nav--offen {
    display: flex;
  }

  .kopf--gescrollt .kopf__nav,
  .kopf--dunkel .kopf__nav {
    background: var(--farbe-lila);
  }

  .kopf--gescrollt .kopf__burger,
  .kopf--gescrollt .kopf__burger::before,
  .kopf--gescrollt .kopf__burger::after,
  .kopf--dunkel .kopf__burger,
  .kopf--dunkel .kopf__burger::before,
  .kopf--dunkel .kopf__burger::after {
    background: var(--farbe-pfirsich);
  }

  .kopf--gescrollt .kopf__burger--offen,
  .kopf--dunkel .kopf__burger--offen {
    background: transparent;
  }

  .kopf__liste {
    flex-direction: column;
    gap: var(--abstand-xs);
  }

  .kopf__link {
    font-size: var(--groesse-zettel-titel);
  }
}
</style>
