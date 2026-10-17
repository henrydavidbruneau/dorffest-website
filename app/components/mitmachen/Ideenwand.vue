<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.mitmachen.ideenwand
const { eintraege, status, fehler, neuId, anpinnen } = usePinnwand<Idee>('/api/ideen')
const form = reactive({ name: '', text: '', website: '' })

// Post-its in wechselnden Farben und Drehungen
const farben = ['gelb', 'pfirsich', 'flieder', 'weiss'] as const
const stil = (i: number) => ({ farbe: farben[i % 4], drehung: [-2.5, 1.8, -1, 2.6, -1.8, 0.8][i % 6] })

async function absenden() {
  if (await anpinnen({ ...form })) form.text = ''
}
</script>

<template>
  <section class="wand" aria-labelledby="wand-titel">
    <div class="inhalt">
      <p class="wand__zusatz handschrift">{{ t.zusatz }}</p>
      <h2 id="wand-titel" class="wand__titel">{{ t.titel }}</h2>
      <p class="wand__text">{{ t.text }}</p>

      <form class="wand__formular" novalidate @submit.prevent="absenden">
        <BasisFeld v-model="form.text" label="Deine Idee" name="text" required :maxlength="280" placeholder="z.B. ein Bücherschrank am Marktplatz" class="wand__idee" />
        <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="given-name" required :maxlength="60" />
        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <BasisKnopf type="submit" :disabled="status === 'sendet'" class="wand__knopf">
          {{ status === 'sendet' ? 'Wird angepinnt …' : 'Anpinnen' }}
        </BasisKnopf>
      </form>
      <p v-if="status === 'fehler'" class="wand__fehler" role="alert">{{ fehler }}</p>

      <ul class="wand__zettel" aria-label="Angepinnte Ideen">
        <li
          v-for="(idee, i) in eintraege"
          :key="idee.id"
          class="postit"
          :class="[`postit--${stil(i).farbe}`, { 'postit--neu': idee.id === neuId }]"
          :style="{ '--drehung': `${stil(i).drehung}deg` }"
        >
          <span class="postit__pin" aria-hidden="true" />
          <p class="postit__text handschrift">{{ idee.text }}</p>
          <p class="postit__name">– {{ idee.name }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.wand {
  padding-block: var(--abstand-sektion);
  background:
    radial-gradient(circle, rgb(122 42 126 / 0.08) 1px, transparent 1.5px) 0 0 / 22px 22px,
    var(--farbe-creme);
}

.wand__zusatz {
  margin: 0;
  color: var(--farbe-orange);
}

.wand__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h2);
}

.wand__text {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-l);
}

.wand__formular {
  display: grid;
  gap: var(--abstand-s);
  align-items: end;
  max-width: 52rem;
  margin-top: var(--abstand-l);
}

.wand__fehler {
  margin: var(--abstand-s) 0 0;
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.wand__zettel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
  gap: var(--abstand-l);
  margin: var(--abstand-xl) 0 0;
  padding: 0;
  list-style: none;
}

.postit {
  position: relative;
  min-height: 11rem;
  padding: 1.75rem 1.2rem 1rem;
  box-shadow: 3px 6px 12px rgb(0 0 0 / 0.14);
  transform: rotate(var(--drehung));
  display: flex;
  flex-direction: column;
}

.postit p {
  margin: 0;
}

.postit--gelb { background: var(--farbe-gelb); }
.postit--pfirsich { background: var(--farbe-pfirsich); }
.postit--flieder { background: var(--farbe-tape-flieder); }
.postit--weiss { background: var(--farbe-weiss); }

.postit__pin {
  position: absolute;
  top: 0.6rem;
  left: 50%;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--farbe-lila);
  box-shadow: 1px 3px 0 rgb(0 0 0 / 0.25);
  transform: translateX(-50%);
}

.postit__text {
  font-size: clamp(1.5rem, 2vw, 1.75rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.postit .postit__name {
  margin-top: auto;
  padding-top: 0.6rem;
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
  text-align: right;
}

.postit--neu {
  animation: anpinnen 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

@keyframes anpinnen {
  from {
    opacity: 0;
    transform: translateY(-24px) rotate(-10deg) scale(1.1);
  }
}

@media (min-width: 48rem) {
  .wand__formular {
    grid-template-columns: 1fr 12rem auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .postit--neu {
    animation: none;
  }
}
</style>
