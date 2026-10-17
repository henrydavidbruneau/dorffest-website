<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.start.wasBisherGeschah
const { data: artikel } = await useDorfanzeiger({ hervorgehoben: true, limit: 3 })
</script>

<template>
  <section class="geschah" aria-labelledby="geschah-titel">
    <div class="inhalt">
      <h2 id="geschah-titel" class="geschah__titel">
        Was bisher <BasisHervorhebung :drehung="-2">geschah</BasisHervorhebung>
      </h2>
      <p class="geschah__text">{{ t.text }}</p>

      <div class="geschah__zeitung">
        <BasisKlebeband position="links" farbe="gelb" :drehung="-4" />
        <div class="geschah__masthead">
          <div>
            <p class="geschah__zusatz handschrift">{{ t.zusatz }}</p>
            <h3 class="geschah__zeitungstitel">{{ t.titel }}</h3>
          </div>
          <NuxtLink to="/dorfanzeiger" class="geschah__link handschrift">→ {{ t.link }}</NuxtLink>
        </div>

        <div class="geschah__artikel">
          <BasisArtikelTeaser v-for="a in artikel" :key="a.id" :artikel="a" :ebene="4" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.geschah {
  padding-block: var(--abstand-2xl);
  background: var(--farbe-pfirsich);
}

.geschah__titel {
  text-align: center;
}

.geschah__text {
  max-width: 36rem;
  margin: var(--abstand-m) auto var(--abstand-xl);
  font-size: var(--groesse-s);
  text-align: center;
}

.geschah__zeitung {
  position: relative;
  padding: var(--abstand-m);
  border-radius: var(--radius-l);
  background: var(--farbe-creme);
  box-shadow: var(--schatten-karte);
}

.geschah__masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--abstand-2xs) var(--abstand-m);
  padding-bottom: var(--abstand-xs);
  margin-bottom: var(--abstand-m);
  border-bottom: 3px solid var(--farbe-schwarz);
}

.geschah__zusatz {
  margin: 0;
  font-size: 1.5rem;
  color: var(--farbe-orange-text);
}

.geschah__zeitungstitel {
  font-size: clamp(1.75rem, 1rem + 3vw, 3rem);
  color: var(--farbe-schwarz);
}

.geschah__link {
  font-size: 1.6rem;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.geschah__link:hover {
  text-decoration: underline;
}

.geschah__artikel {
  display: grid;
  gap: var(--abstand-l);
}

@media (min-width: 48rem) {
  .geschah__zeitung {
    padding: var(--abstand-l);
  }

  .geschah__artikel {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
