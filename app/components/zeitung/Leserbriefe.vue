<script setup lang="ts">
// Leserbriefe: angepinnte Zeitungsschnipsel + Zettel zum Selberschreiben
const { eintraege, status, fehler, neuId, anpinnen } = usePinnwand<Leserbrief>('/api/leserbriefe')
const form = reactive({ name: '', text: '', website: '', turnstile: '' })

// leichte, feste Unregelmäßigkeit je Brief
const drehung = (i: number) => [-1.6, 1.2, -0.6, 1.8, -1.2, 0.8][i % 6]

async function absenden() {
  if (await anpinnen({ ...form })) {
    form.text = ''
  }
}
</script>

<template>
  <section class="briefe" aria-labelledby="rubrik-leserbriefe">
    <ZeitungRubrik id="rubrik-leserbriefe" titel="Leserbriefe" zusatz="schreib uns!" />

    <ul class="briefe__wand">
      <!-- Zettel zum Selberschreiben -->
      <li class="brief brief--formular">
        <form class="brief__formular" novalidate @submit.prevent="absenden">
          <p class="brief__zusatz handschrift">dein Leserbrief</p>
          <label class="nur-screenreader" for="leserbrief-text">Dein Leserbrief</label>
          <textarea
            id="leserbrief-text"
            v-model="form.text"
            name="text"
            rows="5"
            maxlength="600"
            placeholder="Liebe Nachbar*innen, …"
            class="brief__eingabe brief__eingabe--text"
          />
          <label class="nur-screenreader" for="leserbrief-name">Dein Name</label>
          <input
            id="leserbrief-name"
            v-model="form.name"
            name="name"
            maxlength="60"
            autocomplete="name"
            placeholder="– dein Name"
            class="brief__eingabe"
          >
          <div class="nur-screenreader" aria-hidden="true">
            <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <BasisTurnstile v-model="form.turnstile" />
          <p v-if="status === 'fehler'" class="brief__fehler" role="alert">{{ fehler }}</p>
          <p v-else-if="status === 'fertig'" class="brief__danke" role="status">Danke! Dein Brief hängt jetzt an der Wand.</p>
          <BasisKnopf type="submit" groesse="klein" :disabled="status === 'sendet'">
            {{ status === 'sendet' ? 'Wird angepinnt …' : 'Anpinnen' }}
          </BasisKnopf>
        </form>
      </li>
      <li
        v-for="(b, i) in eintraege"
        :key="b.id"
        class="brief"
        :class="{ 'brief--neu': b.id === neuId }"
        :style="{ '--drehung': `${drehung(i)}deg` }"
      >
        <span class="brief__pin" aria-hidden="true" />
        <p class="brief__anrede">Liebe Nachbar*innen,</p>
        <p class="brief__text">{{ b.text }}</p>
        <p class="brief__name">– {{ b.name }}</p>
      </li>

    </ul>
  </section>
</template>

<style scoped>
.briefe {
  margin-top: clamp(2.5rem, 3.4vw, 3rem);
}

.briefe__wand {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
  gap: var(--abstand-l) var(--abstand-m);
  align-items: start;
  margin: var(--abstand-l) 0 0;
  padding: 0 0 var(--abstand-l);
  list-style: none;
}

/* ausgeschnittener Zeitungsschnipsel mit gezackter Unterkante */
.brief {
  position: relative;
  padding: 1.6rem 1.1rem 1.4rem;
  border: 1px solid #d8d0bf;
  background: var(--farbe-weiss);
  box-shadow: 2px 4px 10px rgb(0 0 0 / 0.12);
  transform: rotate(var(--drehung, 0deg));
  clip-path: polygon(0 0, 100% 0, 100% 96%, 92% 100%, 84% 97%, 75% 100%, 66% 97%, 57% 100%, 48% 97%, 39% 100%, 30% 97%, 21% 100%, 12% 97%, 4% 100%, 0 97%);
}

.brief p {
  margin: 0;
}

.brief__pin {
  position: absolute;
  top: 0.55rem;
  left: 50%;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  background: var(--farbe-orange);
  box-shadow: 1px 2px 0 rgb(0 0 0 / 0.3);
  transform: translateX(-50%);
}

.brief__anrede {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-xs);
  text-transform: uppercase;
}

.brief .brief__text {
  margin-top: 0.4rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.9375rem;
  line-height: 1.5;
  hyphens: auto;
}

.brief .brief__name {
  margin-top: 0.6rem;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  color: var(--farbe-lila);
}

.brief--neu {
  animation: anpinnen 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

@keyframes anpinnen {
  from {
    opacity: 0;
    transform: translateY(-20px) rotate(-8deg) scale(1.08);
  }
}

/* Formular-Zettel */
.brief--formular {
  border: 2px dashed var(--farbe-lila);
  background: var(--farbe-zeitungspapier);
  box-shadow: none;
  transform: rotate(0.6deg);
  clip-path: none;
}

.brief__formular {
  display: grid;
  gap: 0.6rem;
}

.brief__zusatz {
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.brief__eingabe {
  width: 100%;
  padding: 0.4rem 0.2rem;
  border: 0;
  border-bottom: 2px dotted var(--farbe-lila);
  background: transparent;
  font-family: var(--schrift-hand);
  font-size: 1.4rem;
  line-height: 1.3;
  color: var(--farbe-schwarz);
}

.brief__eingabe--text {
  resize: vertical;
  background-image: repeating-linear-gradient(transparent 0 1.78rem, rgb(122 42 126 / 0.25) 1.78rem 1.82rem);
  border-bottom: 0;
}

.brief__fehler,
.brief__danke {
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
}

.brief__fehler {
  color: #a3001b;
}

.brief__danke {
  color: var(--farbe-lila);
}

.brief__formular :deep(.knopf) {
  justify-self: start;
}

@media (prefers-reduced-motion: reduce) {
  .brief--neu {
    animation: none;
  }
}
</style>
