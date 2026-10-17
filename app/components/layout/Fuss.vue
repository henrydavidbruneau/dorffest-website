<script setup lang="ts">
import { fussnavigation } from '~/navigation'
import { texte } from '~/texte'
</script>

<template>
  <footer class="fuss">
    <div class="inhalt">
      <div class="fuss__gruss">
        <div>
          <p class="fuss__titel display">
            Bis bald<br>im <BasisHervorhebung :drehung="-2">Dorf!</BasisHervorhebung>
          </p>
          <p class="fuss__unterschrift handschrift">{{ texte.fuss.gruss }}</p>
        </div>
        <BasisNewsletterBox variante="schlicht" :label="texte.fuss.newsletterLabel" class="fuss__newsletter" />
      </div>

      <BasisTrennlinie art="gestrichelt" farbe="schwarz" />

      <div class="fuss__unten">
        <NuxtLink to="/" class="fuss__logo">
          <img src="/logo.svg" alt="Königsdorf rückt zusammen – zur Startseite" width="512" height="339" loading="lazy">
        </NuxtLink>
        <nav class="fuss__nav" aria-label="Fußnavigation">
          <div v-for="spalte in fussnavigation" :key="spalte.titel" class="fuss__spalte">
            <h2 class="fuss__spaltentitel">{{ spalte.titel }}</h2>
            <ul>
              <li v-for="link in spalte.links" :key="link.text">
                <NuxtLink :to="link.to" :target="link.to.startsWith('http') ? '_blank' : undefined">{{ link.text }}</NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.fuss {
  padding-block: var(--abstand-2xl) var(--abstand-l);
  background: var(--farbe-pfirsich);
}

.fuss__gruss {
  display: grid;
  gap: var(--abstand-l);
  align-items: center;
  margin-bottom: var(--abstand-xl);
}

.fuss__titel {
  margin: 0;
  font-size: var(--groesse-h2);
  color: var(--farbe-lila);
}

.fuss__unterschrift {
  margin: var(--abstand-s) 0 0;
  color: var(--farbe-orange-text);
}

.fuss__unten {
  display: grid;
  gap: var(--abstand-l);
  padding-top: var(--abstand-l);
}

.fuss__logo img {
  width: 6rem;
}

.fuss__nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--abstand-m);
}

.fuss__spaltentitel {
  margin-bottom: var(--abstand-2xs);
  font-size: var(--groesse-m);
}

.fuss__spalte ul {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--groesse-s);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.9;
}

.fuss__spalte a {
  text-decoration: none;
}

.fuss__spalte a:hover {
  text-decoration: underline;
}

@media (min-width: 48rem) {
  .fuss__gruss {
    grid-template-columns: 1.3fr 1fr;
  }

  .fuss__unten {
    grid-template-columns: auto 1fr;
    gap: var(--abstand-2xl);
  }
}
</style>
