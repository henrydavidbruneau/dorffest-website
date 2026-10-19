<script setup lang="ts">
import { fussnavigation } from '~/navigation'
import { texte } from '~/texte'

// Kontakt und Infochannel kommen aus den Vereinsdaten (Directus); dazu dezent der Weg ins Vereinsheim
const verein = useVerein()
const spalten = computed(() => fussnavigation.map(spalte => ({
  ...spalte,
  links: spalte.links.map((link) => {
    if (link.text === 'Kontakt') return { ...link, to: `mailto:${verein.value.kontakt_email}` }
    if (link.text === 'Infochannel') return { ...link, to: verein.value.infochannel_url }
    return link
  }),
})))
</script>

<template>
  <footer class="fuss">
    <div class="fuss__inhalt inhalt-breit">
      <div class="fuss__gruss">
        <div>
          <p class="fuss__titel display">
            Bis bald<br>im <BasisHervorhebung>Dorf!</BasisHervorhebung>
          </p>
          <p class="fuss__unterschrift handschrift">{{ texte.fuss.gruss }}</p>
        </div>
        <BasisNewsletterBox variante="schlicht" :label="texte.fuss.newsletterLabel" class="fuss__newsletter" />
      </div>

      <BasisTrennlinie class="fuss__linie" />

      <div class="fuss__unten">
        <NuxtLink to="/" class="fuss__logo">
          <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen – zur Startseite" width="512" height="245" loading="lazy">
        </NuxtLink>
        <nav class="fuss__nav" aria-label="Fußnavigation">
          <div v-for="spalte in spalten" :key="spalte.titel" class="fuss__spalte">
            <h2 class="fuss__spaltentitel">{{ spalte.titel }}</h2>
            <ul>
              <li v-for="link in spalte.links" :key="link.text">
                <a v-if="link.to.startsWith('mailto:')" :href="link.to">{{ link.text }}</a>
                <NuxtLink v-else :to="link.to" :target="link.to.startsWith('http') ? '_blank' : undefined">{{ link.text }}</NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <p class="fuss__vereinsheim"><NuxtLink to="/vereinsheim">Vereinsheim</NuxtLink></p>
    </div>
  </footer>
</template>

<style scoped>
/* Maße aus dem Design: 100 oben, Titel 112px, Linie bei 1260, Spalten 267 breit */
.fuss {
  padding-block: clamp(3.5rem, 7vw, 6.25rem) clamp(2rem, 3.5vw, 3.25rem);
  background: var(--farbe-pfirsich);
}



.fuss__gruss {
  display: grid;
  gap: var(--abstand-l);
  align-items: center;
}

.fuss__titel {
  margin: 0;
  font-size: var(--groesse-h2-gross);
  line-height: 0.95;
  color: var(--farbe-lila);
}

.fuss__titel :deep(.hervorhebung) {
  margin-top: 0.06em;
}

.fuss__unterschrift {
  margin: clamp(0.5rem, 1.2vw, 1rem) 0 0;
  font-size: clamp(1.625rem, 2.5vw, 2.25rem);
  color: var(--farbe-orange-text);
  transform: rotate(-1.5deg);
}

.fuss__linie {
  margin-block: clamp(2.5rem, 3.9vw, 3.5rem) clamp(1.75rem, 2.5vw, 2.25rem);
}

.fuss__unten {
  display: grid;
  gap: var(--abstand-l);
}

.fuss__logo img {
  width: clamp(6rem, 9.3vw, 8.375rem);
}

.fuss__nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--abstand-m);
}

.fuss__spaltentitel {
  margin-bottom: 0.6rem;
  font-size: clamp(1.125rem, 1.39vw, 1.25rem);
}

.fuss__spalte ul {
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--schrift-display);
  font-weight: 400;
  font-size: var(--groesse-m);
  line-height: 1.65;
}

.fuss__spalte a {
  text-decoration: none;
}

.fuss__spalte a:hover {
  text-decoration: underline;
}

@media (min-width: 48rem) {
  .fuss__gruss {
    grid-template-columns: 1fr minmax(0, 28rem);
  }

  .fuss__unten {
    grid-template-columns: 1fr 3fr;
  }

  .fuss__nav {
    grid-template-columns: repeat(3, 1fr);
  }
}
.fuss__vereinsheim {
  margin: var(--abstand-l) 0 0;
  font-size: var(--groesse-xs);
  text-align: right;
}

.fuss__vereinsheim a {
  color: inherit;
  opacity: 0.7;
}

.fuss__vereinsheim a:hover {
  opacity: 1;
}
</style>
