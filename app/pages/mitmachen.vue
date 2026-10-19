<script setup lang="ts">
import { texte } from '~/texte'

const verein = useVerein()

const t = texte.mitmachen
useSeoMeta({ title: 'Mitmachen', description: t.meta, ogTitle: 'Mitmachen – Königsdorf rückt zusammen', ogDescription: t.meta })

// Eigene Idee einreichen
const { status, fehler, senden } = useFormular('/api/vorschlaege')
const form = reactive({ name: '', email: '', idee: '', dorffest: true, selbst_mitmachen: true, website: '', turnstile: '' })

const drehungen = [-1.5, 1, -1, 1.5]
</script>

<template>
  <div>
    <!-- Intro -->
    <header class="intro inhalt">
      <p class="intro__zusatz handschrift">offen für alle</p>
      <h1 class="intro__titel">Mach <BasisHervorhebung>mit!</BasisHervorhebung></h1>
      <div class="intro__text">
        <p>{{ t.intro }}</p>
        <p>{{ t.intro2 }}</p>
      </div>
    </header>

    <!-- Wege -->
    <section class="wege inhalt" aria-label="So kannst du mitmachen">
      <ol class="wege__liste">
        <li v-for="(w, i) in t.wege" :key="w.titel">
          <BasisNotizzettel farbe="weiss" rahmen="orange" tape="mitte" tape-farbe="flieder" :tape-drehung="0" :drehung="drehungen[i]" class="weg">
            <span class="weg__nr" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <h2 class="weg__titel">{{ w.titel }}</h2>
            <p class="weg__text">{{ w.text }}</p>
            <NuxtLink :to="w.link" class="weg__link handlink">→ {{ w.linkText }}</NuxtLink>
          </BasisNotizzettel>
        </li>
      </ol>
    </section>

    <MitmachenPlenum />

    <!-- Dorffest-Aufruf + Ideen-Formular -->
    <section id="dorffest" class="aufruf" aria-labelledby="aufruf-titel">
      <div class="aufruf__raster inhalt">
        <div>
          <p class="aufruf__zusatz handschrift">{{ t.dorffest.zusatz }}</p>
          <h2 id="aufruf-titel" class="aufruf__titel">Dorffest<br><BasisHervorhebung>2027</BasisHervorhebung></h2>
          <p class="aufruf__text">{{ t.dorffest.text }}</p>
        </div>

        <BasisNotizzettel id="idee" farbe="creme" befestigung="pin" :drehung="1.2" class="idee">
          <h3 class="idee__titel">{{ t.idee.titel }}</h3>
          <p v-if="status === 'fertig'" class="idee__danke" role="status">
            <span class="handschrift">Danke, {{ form.name }}!</span><br>Wir schauen uns deine Idee an und melden uns bei dir.
          </p>
          <form v-else class="idee__formular" novalidate @submit.prevent="senden({ ...form })">
            <p class="idee__text">{{ t.idee.text }}</p>
            <BasisFeld v-model="form.idee" label="Deine Idee" name="idee" mehrzeilig required :maxlength="2000" />
            <div class="idee__felder">
              <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
              <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" required />
            </div>
            <label class="idee__haken"><input v-model="form.dorffest" type="checkbox"> Die Idee ist fürs Dorffest 2027</label>
            <label class="idee__haken"><input v-model="form.selbst_mitmachen" type="checkbox"> Ich würde selbst mit anpacken</label>
            <div class="nur-screenreader" aria-hidden="true">
              <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
            </div>
            <BasisTurnstile v-model="form.turnstile" />
            <p v-if="status === 'fehler'" class="idee__fehler" role="alert">{{ fehler }}</p>
            <BasisKnopf type="submit" :disabled="status === 'sendet'">
              {{ status === 'sendet' ? 'Wird gesendet …' : 'Idee abschicken' }}
            </BasisKnopf>
          </form>
        </BasisNotizzettel>
      </div>
    </section>

    <MitmachenIdeenwand />

    <!-- Kontakt -->
    <section class="kontakt inhalt" aria-label="Kontakt">
      <p>
        {{ t.kontakt }}
        <a :href="`mailto:${verein.kontakt_email}`" class="kontakt__mail">{{ verein.kontakt_email }}</a>
      </p>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Intro ---------- */
.intro {
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
}

.intro__zusatz {
  margin: 0;
  color: var(--farbe-orange);
}

.intro__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h1);
  line-height: 0.9;
}

.intro__text {
  max-width: 44rem;
  margin-top: var(--abstand-m);
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.intro__text p {
  margin: 0 0 0.8em;
}

/* ---------- Wege ---------- */
.wege {
  padding-block: var(--abstand-xl) var(--abstand-sektion);
}

.wege__liste {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.weg {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.75rem 1.4rem 1.4rem;
}

.weg__nr {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 2.5rem;
  line-height: 1;
  color: var(--farbe-orange);
}

.weg__titel {
  margin-top: 0.4rem;
  font-size: var(--groesse-h3);
  line-height: 1;
}

.weg__text {
  margin: 0.6rem 0 1rem;
  font-size: var(--groesse-s);
  line-height: 1.55;
}

.weg__link {
  margin-top: auto;
  color: var(--farbe-lila);
}

/* ---------- Dorffest-Aufruf ---------- */
.aufruf {
  padding-block: var(--abstand-sektion);
  background: var(--farbe-orange);
  scroll-margin-top: 4rem;
}

.aufruf__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: start;
}

.aufruf__zusatz {
  margin: 0;
  color: var(--farbe-creme);
  transform: rotate(-3deg);
  transform-origin: left;
}

.aufruf__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h2-gross);
  line-height: 0.88;
}

.aufruf__titel :deep(.hervorhebung) {
  margin-top: 0.05em;
}

.aufruf__text {
  max-width: 30rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
  color: var(--farbe-schwarz);
}

.idee {
  scroll-margin-top: 6rem;
  padding: clamp(2.5rem, 4vw, 3.5rem) clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 3vw, 2.25rem);
  border-radius: var(--radius-xl);
}

.idee p {
  margin: 0;
}

.idee__titel {
  font-size: var(--groesse-h3);
}

.idee__text {
  font-size: var(--groesse-s);
}

.idee__formular {
  display: grid;
  gap: var(--abstand-s);
  margin-top: 0.5rem;
}

.idee__felder {
  display: grid;
  gap: var(--abstand-s);
}

.idee__haken {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: var(--groesse-s);
  cursor: pointer;
}

.idee__haken input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--farbe-lila);
}

.idee__fehler {
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-m);
  background: var(--farbe-pfirsich);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.idee__danke {
  margin-top: var(--abstand-s) !important;
}

.idee__danke .handschrift {
  color: var(--farbe-lila);
}

.idee__formular :deep(.knopf) {
  justify-self: start;
}

/* ---------- Kontakt ---------- */
.kontakt {
  padding-block: var(--abstand-xl);
  font-size: var(--groesse-l);
  text-align: center;
}

.kontakt p {
  margin: 0;
}

.kontakt__mail {
  font-weight: var(--gewicht-text-mittel);
  color: var(--farbe-lila);
  overflow-wrap: anywhere;
}

@media (min-width: 40rem) {
  .idee__felder {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 56rem) {
  .aufruf__raster {
    grid-template-columns: 1fr 1.15fr;
  }
}
</style>
