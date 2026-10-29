<script setup lang="ts">
// Öffentliche Wunschliste eines Termins (z.B. „Welche Lieder sollen wir singen?“), ohne Anmeldung:
// Wunsch eintragen (sofort sichtbar, das Vereinsheim moderiert) und mit ▲ dafür stimmen.
// Eine Stimme je Wunsch, nochmal tippen nimmt sie zurück; die meisten Stimmen stehen oben.
const props = defineProps<{ termin: TerminDetail }>()

const { wuensche, status, fehler, meldung, wuenschen, stimmen } = useWunschliste(() => props.termin.slug)
const form = reactive({ text: '', name: '', website: '', turnstile: '' })
const offen = computed(() => !props.termin.vergangen)

async function absenden() {
  if (form.text.trim().length < 2) {
    fehler.value = 'Was wünschst du dir?'
    return
  }
  if (await wuenschen({ ...form })) form.text = ''
}

const stimmenText = (n: number) => (n === 1 ? '1 Stimme' : `${n} Stimmen`)
</script>

<template>
  <section id="wunschliste" class="wunschliste" aria-labelledby="wunschliste-titel">
    <p class="wunschliste__zusatz handschrift">Mitbestimmen</p>
    <h2 id="wunschliste-titel" class="wunschliste__titel">{{ termin.wunschliste_frage || 'Was wünschst du dir?' }}</h2>
    <p v-if="termin.wunschliste_text" class="wunschliste__text">{{ termin.wunschliste_text }}</p>

    <div class="wunschliste__blatt">
      <BasisKlebeband position="mitte" farbe="gelb" :drehung="-2" :breite="6" />
      <p class="wunschliste__kopf handschrift">{{ offen ? 'Wunschliste' : 'So wurde abgestimmt' }}</p>

      <p v-if="offen && wuensche.length" class="wunschliste__anleitung">
        Tipp auf <span class="wunschliste__pfeil" aria-hidden="true">▲</span><span class="nur-screenreader">„dafür“</span>, wenn du etwas auch hören willst –
        eine Stimme pro Wunsch, nochmal tippen nimmt sie zurück. <strong>Die meisten Stimmen stehen oben.</strong>
      </p>
      <p v-else-if="!wuensche.length" class="wunschliste__leer">{{ offen ? 'Noch ist die Liste leer – mach den Anfang!' : 'Hier hat sich niemand etwas gewünscht.' }}</p>

      <TransitionGroup tag="ol" name="wunsch" class="wunschliste__liste">
        <li v-for="(w, i) in wuensche" :key="w.id" class="wunsch" :class="{ 'wunsch--meins': w.meine, 'wunsch--vorn': i === 0 && w.stimmen > 0 }">
          <span class="wunsch__platz" aria-hidden="true">{{ i + 1 }}.</span>
          <span class="wunsch__text">
            <span class="wunsch__titel handschrift">{{ w.text }}</span>
            <span v-if="w.name" class="wunsch__name">gewünscht von {{ w.name }}</span>
          </span>
          <button
            v-if="offen"
            type="button"
            class="wunsch__stimme"
            :aria-pressed="w.meine"
            :aria-label="`${w.meine ? 'Stimme zurücknehmen' : 'Dafür stimmen'}: ${w.text} (${stimmenText(w.stimmen)})`"
            @click="stimmen(w)"
          >
            <span class="wunsch__pfeil" aria-hidden="true">▲</span>
            <span class="wunsch__zahl">{{ w.stimmen }}</span>
          </button>
          <span v-else class="wunsch__stimme wunsch__stimme--fest">{{ stimmenText(w.stimmen) }}</span>
        </li>
      </TransitionGroup>

      <form v-if="offen" class="wunschliste__formular" novalidate @submit.prevent="absenden">
        <p class="wunschliste__plus handschrift" aria-hidden="true">+ dein Wunsch</p>
        <div class="wunschliste__felder">
          <BasisFeld v-model="form.text" label="Dein Wunsch" name="text" required :maxlength="120" placeholder="z.B. 99 Luftballons" />
          <BasisFeld v-model="form.name" label="Dein Name" name="name" autocomplete="given-name" :maxlength="60" />
        </div>
        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <BasisTurnstile v-model="form.turnstile" />
        <p v-if="fehler" class="wunschliste__fehler" role="alert">{{ fehler }}</p>
        <p v-else-if="status === 'fertig'" class="wunschliste__danke" role="status">{{ meldung }}</p>
        <BasisKnopf type="submit" groesse="klein" :disabled="status === 'sendet'">
          {{ status === 'sendet' ? 'Kommt auf die Liste …' : 'Auf die Liste' }}
        </BasisKnopf>
      </form>
    </div>
  </section>
</template>

<style scoped>
.wunschliste {
  scroll-margin-top: 7rem;
}

.wunschliste__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.wunschliste__titel {
  margin-top: 0.2rem;
  font-size: var(--groesse-h3);
}

.wunschliste__text {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-l);
}

/* Setlist-Zettel wie auf dem Plakat */
.wunschliste__blatt {
  position: relative;
  margin-top: var(--abstand-l);
  padding: clamp(2rem, 3.5vw, 2.75rem) clamp(1.25rem, 3.5vw, 2.75rem) clamp(1.5rem, 3vw, 2.25rem);
  border-radius: var(--radius-s);
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
  transform: rotate(0.6deg);
}

.wunschliste__kopf {
  display: inline-block;
  margin: 0;
  border-bottom: 2px solid currentcolor;
  font-size: clamp(2.25rem, 4vw, 2.75rem);
  line-height: 1;
}

.wunschliste__anleitung,
.wunschliste__leer {
  max-width: 34rem;
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-s);
}

.wunschliste__pfeil {
  color: var(--farbe-lila);
}

.wunschliste__liste {
  position: relative;
  margin: var(--abstand-m) 0 0;
  padding: 0;
  list-style: none;
}

.wunsch {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding-block: 0.55rem;
  border-bottom: 1px dashed rgb(122 42 126 / 0.3);
}

.wunsch__platz {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.25rem;
  color: var(--farbe-lila);
  text-align: right;
}

.wunsch--vorn .wunsch__platz {
  color: var(--farbe-orange);
}

.wunsch__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wunsch__titel {
  font-size: clamp(1.6rem, 2.6vw, 1.9rem);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.wunsch__name {
  font-size: var(--groesse-xs);
  color: rgb(0 0 0 / 0.6);
}

/* Stimm-Knopf: Pfeil + Zahl; gedrückt = gefüllt lila */
.wunsch__stimme {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 3.25rem;
  min-height: 3.25rem;
  padding: 0.25rem 0.5rem;
  border: 2px solid var(--farbe-lila);
  border-radius: var(--radius-l);
  background: var(--farbe-weiss);
  color: var(--farbe-lila);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, transform 0.15s;
}

.wunsch__stimme:hover {
  transform: translateY(-2px);
}

.wunsch__stimme[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.wunsch__pfeil {
  font-size: 0.85rem;
}

.wunsch__zahl {
  margin-top: 0.15rem;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.2rem;
}

.wunsch__stimme--fest {
  border-color: transparent;
  font-size: var(--groesse-xs);
  cursor: default;
}

.wunschliste__formular {
  display: grid;
  gap: var(--abstand-s);
  justify-items: start;
  margin-top: var(--abstand-l);
}

.wunschliste__plus {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-lila);
}

.wunschliste__felder {
  display: grid;
  gap: var(--abstand-s);
  width: 100%;
}

.wunschliste__fehler,
.wunschliste__danke {
  margin: 0;
  font-weight: var(--gewicht-text-mittel);
}

.wunschliste__fehler {
  color: #a3001b;
}

.wunschliste__danke {
  color: var(--farbe-lila);
}

/* nach oben rutschen, wenn ein Wunsch Stimmen bekommt */
.wunsch-move,
.wunsch-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.wunsch-enter-from {
  opacity: 0;
  transform: translateY(-0.75rem);
}

@media (min-width: 40rem) {
  .wunschliste__felder {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wunsch-move,
  .wunsch-enter-active,
  .wunsch__stimme {
    transition: none;
  }

  .wunsch__stimme:hover {
    transform: none;
  }
}
</style>
