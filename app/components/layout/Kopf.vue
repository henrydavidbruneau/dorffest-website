<script setup lang="ts">
import { hauptnavigation, links } from '~/navigation'

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
  <header class="kopf" :class="{ 'kopf--gescrollt': gescrollt }">
    <a href="#inhalt" class="kopf__sprunglink">Zum Inhalt springen</a>
    <div class="kopf__leiste inhalt">
      <NuxtLink to="/" class="kopf__logo">
        <img src="/logo.svg" alt="Königsdorf rückt zusammen – zur Startseite" width="512" height="339">
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
        <BasisKnopf :to="links.mitmachen" :variante="gescrollt ? 'hell' : 'gefuellt'" groesse="klein" class="kopf__mitmachen">Mitmachen</BasisKnopf>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.kopf {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--farbe-creme);
  transition:
    background-color var(--dauer-mittel) ease,
    box-shadow var(--dauer-mittel) ease;
}

/* beim Scrollen: kompakter und lila */
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

.kopf__leiste {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-m);
  padding-block: var(--abstand-s);
  transition: padding var(--dauer-mittel) ease;
}

.kopf--gescrollt .kopf__leiste {
  padding-block: var(--abstand-2xs);
}

.kopf__logo img {
  width: clamp(4.5rem, 3.5rem + 3vw, 6rem);
  transition: width var(--dauer-mittel) ease;
}

.kopf--gescrollt .kopf__logo img {
  width: clamp(3.5rem, 3rem + 1.5vw, 4.25rem);
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
  font-size: var(--groesse-m);
  letter-spacing: 0.02em;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.kopf--gescrollt .kopf__link {
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
    gap: var(--abstand-l);
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
    left: 0;
    right: 0;
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--abstand-m);
    padding: var(--abstand-m) var(--seitenrand) var(--abstand-l);
    border-bottom: 3px dotted var(--farbe-orange);
    background: var(--farbe-creme);
  }

  .kopf__nav--offen {
    display: flex;
  }

  .kopf--gescrollt .kopf__nav {
    border-bottom-color: var(--farbe-pfirsich);
    background: var(--farbe-lila);
  }

  .kopf--gescrollt .kopf__burger,
  .kopf--gescrollt .kopf__burger::before,
  .kopf--gescrollt .kopf__burger::after {
    background: var(--farbe-pfirsich);
  }

  .kopf--gescrollt .kopf__burger--offen {
    background: transparent;
  }

  .kopf__liste {
    flex-direction: column;
    gap: var(--abstand-xs);
  }

  .kopf__link {
    font-size: var(--groesse-xl);
  }
}
</style>
