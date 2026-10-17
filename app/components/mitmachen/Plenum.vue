<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.mitmachen.plenum
const { data: termin } = await useTermin('plenum')

const { status, fehler, senden } = useFormular('/api/plenum-erinnerung')
const form = reactive({ name: '', email: '', wie: 'jedes', einwilligung: false, website: '' })
</script>

<template>
  <section id="plenum" class="plenum" aria-labelledby="plenum-titel">
    <div class="plenum__raster inhalt">
      <div>
        <p class="plenum__zusatz handschrift">hier wird entschieden</p>
        <h2 id="plenum-titel" class="plenum__titel">Das <BasisHervorhebung>Plenum</BasisHervorhebung></h2>
        <p class="plenum__text">{{ t.text }}</p>

        <div v-if="termin?.beginn" class="plenum__naechstes">
          <BasisNotizzettel farbe="pfirsich" radius="l" :drehung="-3" class="plenum__datum">
            <span class="plenum__datum-gross">{{ tagMonat(termin.beginn) }}</span>
            <span class="plenum__datum-klein">{{ wochentagKurz(termin.beginn) }}</span>
          </BasisNotizzettel>
          <p class="plenum__info">
            Nächstes Plenum<br>
            {{ uhrzeit(termin.beginn) }} Uhr · {{ termin.ort ?? 'Ort folgt' }}<br>
            <NuxtLink :to="`/termine/${termin.slug}`" class="plenum__link handlink">→ alle Infos</NuxtLink>
          </p>
        </div>
      </div>

      <BasisNotizzettel farbe="weiss" tape="mitte" tape-farbe="gelb" :drehung="1.5" class="plenum__zettel">
        <p class="plenum__zettel-titel">{{ t.formTitel }}</p>
        <p v-if="status === 'fertig'" class="plenum__danke" role="status">
          <span class="handschrift">Bis bald im Plenum, {{ form.name }}!</span><br>
          Wir schicken dir den Termin und den Link per Mail.
        </p>
        <form v-else class="plenum__formular" novalidate @submit.prevent="senden({ ...form })">
          <p class="plenum__zettel-text">{{ t.formText }}</p>
          <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
          <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" required />
          <div class="plenum__wahl" role="radiogroup" aria-label="Wie oft erinnern?">
            <label><input v-model="form.wie" type="radio" value="jedes"> vor jedem Plenum</label>
            <label><input v-model="form.wie" type="radio" value="naechstes"> nur fürs nächste</label>
          </div>
          <div class="nur-screenreader" aria-hidden="true">
            <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <label class="plenum__haken">
            <input v-model="form.einwilligung" type="checkbox" required>
            <span>Ihr dürft mir dazu Mails schicken. Abmelden geht jederzeit. <NuxtLink to="/datenschutz">Datenschutz</NuxtLink></span>
          </label>
          <p v-if="status === 'fehler'" class="plenum__fehler" role="alert">{{ fehler }}</p>
          <BasisKnopf type="submit" :disabled="status === 'sendet'">
            {{ status === 'sendet' ? 'Wird gesendet …' : 'Anmelden & erinnern' }}
          </BasisKnopf>
        </form>
      </BasisNotizzettel>
    </div>
  </section>
</template>

<style scoped>
.plenum {
  --farbe-fokus: var(--farbe-gelb);
  padding-block: var(--abstand-sektion);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
  scroll-margin-top: 4rem;
}

.plenum__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
}

.plenum__zusatz {
  margin: 0;
  color: var(--farbe-orange);
  transform: rotate(-3deg);
  transform-origin: left;
}

.plenum__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h2-gross);
  color: var(--farbe-pfirsich);
}

.plenum__text {
  max-width: 34rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.plenum__naechstes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-m) var(--abstand-l);
  align-items: center;
  margin-top: var(--abstand-l);
}

.plenum__datum {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 1rem 1.4rem 0.9rem;
}

.plenum__datum-gross {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(3rem, 6vw, 5rem);
  line-height: 0.9;
  color: var(--farbe-orange);
}

.plenum__datum-klein {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.5rem;
  color: var(--farbe-lila);
}

.plenum__info {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.125rem, 1.6vw, 1.4rem);
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--farbe-pfirsich);
}

.plenum__link {
  font-family: var(--schrift-hand);
  font-weight: 400;
  text-transform: none;
  color: var(--farbe-pfirsich);
}

/* Formular-Zettel (heller Grund → Fokus wieder lila) */
.plenum__zettel {
  --farbe-fokus: var(--farbe-lila);
  width: 100%;
  max-width: 28rem;
  justify-self: center;
  padding: var(--abstand-l);
  color: var(--farbe-schwarz);
}

.plenum__zettel p {
  margin: 0;
}

.plenum__zettel-titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.plenum__zettel-text {
  font-size: var(--groesse-s);
}

.plenum__formular {
  display: grid;
  gap: var(--abstand-s);
  margin-top: 0.4rem;
}

.plenum__wahl {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
  font-size: var(--groesse-s);
}

.plenum__wahl label,
.plenum__haken {
  display: inline-flex;
  gap: 0.4rem;
  align-items: flex-start;
  cursor: pointer;
}

.plenum__wahl input,
.plenum__haken input {
  flex: none;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.15rem;
  accent-color: var(--farbe-lila);
}

.plenum__haken {
  font-size: var(--groesse-xs);
  line-height: 1.5;
}

.plenum__fehler {
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-m);
  background: var(--farbe-pfirsich);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.plenum__danke {
  margin-top: var(--abstand-s) !important;
}

.plenum__danke .handschrift {
  color: var(--farbe-lila);
}

.plenum__formular :deep(.knopf) {
  justify-self: start;
}

@media (min-width: 56rem) {
  .plenum__raster {
    grid-template-columns: 1fr 26rem;
  }
}
</style>
