<script setup lang="ts">
import { links } from '~/navigation'

const props = withDefaults(
  defineProps<{
    /**
     * lila:     Startseite "Was kommt" (gestrichelter Rahmen auf lila Grund)
     * schlicht: Fußbereich "Bleib auf dem Laufenden"
     * zettel:   Dorfanzeiger (Pfirsich-Zettel mit Tape)
     */
    variante?: 'lila' | 'schlicht' | 'zettel'
    titel?: string
    text?: string
    /** Sichtbare Beschriftung des Eingabefelds (bei "lila" nur für Screenreader) */
    label?: string
  }>(),
  { variante: 'schlicht', titel: undefined, text: undefined, label: 'Deine E-Mail-Adresse' },
)

const Notizzettel = resolveComponent('BasisNotizzettel')
const huelle = computed(() => (props.variante === 'zettel' ? Notizzettel : 'div'))

const feldId = useId()
const email = ref('')

// Absenden folgt in Phase 7 (POST /api/newsletter)
function absenden() {}
</script>

<template>
  <component
    :is="huelle"
    class="newsletter"
    :class="`newsletter--${variante}`"
    v-bind="variante === 'zettel' ? { farbe: 'pfirsich', tape: 'links', tapeBreite: 6.5, drehung: -2.5, radius: 's' } : {}"
  >
    <div v-if="titel || text" class="newsletter__kopf">
      <h2 v-if="titel" class="newsletter__titel">{{ titel }}</h2>
      <p v-if="text" class="newsletter__text">{{ text }}</p>
    </div>

    <form class="newsletter__formular" @submit.prevent="absenden">
      <label
        :for="feldId"
        class="newsletter__label"
        :class="{ 'nur-screenreader': variante === 'lila', handschrift: variante === 'zettel' }"
      >{{ label }}</label>
      <div class="newsletter__zeile">
        <input
          :id="feldId"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          required
          placeholder="deine@mail.de"
          class="newsletter__eingabe"
        >
        <BasisKnopf
          type="submit"
          :variante="variante === 'lila' ? 'hell' : 'gefuellt'"
          class="newsletter__knopf"
        >
          Eintragen
        </BasisKnopf>
      </div>
      <a :href="links.infochannel" target="_blank" rel="noopener" class="newsletter__infochannel handlink">→ lieber zum Infochannel</a>
    </form>
  </component>
</template>

<style scoped>
.newsletter {
  display: grid;
  gap: var(--abstand-m);
}

.newsletter p {
  margin: 0;
}

.newsletter__titel {
  font-size: var(--groesse-zettel-titel);
  line-height: 1.15;
}

.newsletter .newsletter__text {
  margin-top: var(--abstand-xs);
  font-size: var(--groesse-xs);
  line-height: 1.45;
}

.newsletter__formular {
  display: grid;
  gap: var(--abstand-xs);
  align-content: center;
}

.newsletter__label {
  font-size: var(--groesse-l);
}

.newsletter__zeile {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs) 0.9rem;
}

.newsletter__eingabe {
  flex: 0 1 19.2rem;
  min-width: 0;
  min-height: clamp(2.75rem, 3.68vw, 3.3125rem);
  padding: 0.5em 1.1em;
  border: 2px dashed var(--farbe-orange);
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  font-size: var(--groesse-xs);
  color: var(--farbe-schwarz);
}

.newsletter__eingabe::placeholder {
  color: #6b6b6b;
}

.newsletter__knopf {
  padding-inline: 1.15em;
}

.newsletter__knopf.knopf--gefuellt {
  color: var(--farbe-pfirsich);
}

.newsletter__infochannel {
  justify-self: start;
  color: var(--farbe-lila);
}

/* ---------- lila ---------- */
.newsletter--lila {
  --farbe-fokus: var(--farbe-gelb);
  padding: clamp(1.5rem, 2.8vw, 2.5rem) clamp(1.5rem, 4.4vw, 4rem);
  border: 3px dashed var(--farbe-pfirsich);
  border-radius: var(--radius-xl);
  color: var(--farbe-creme);
}

.newsletter--lila .newsletter__titel {
  max-width: 6.2em;
  color: var(--farbe-pfirsich);
}

.newsletter--lila .newsletter__eingabe {
  flex-basis: 15.6rem;
  min-height: clamp(2.75rem, 3.26vw, 2.9375rem);
  border: 0;
}

.newsletter--lila .newsletter__knopf {
  min-height: clamp(2.75rem, 3.26vw, 2.9375rem);
  border-color: var(--farbe-lila);
  box-shadow: 0 0 0 2px var(--farbe-pfirsich);
}

.newsletter--lila .newsletter__infochannel {
  color: var(--farbe-pfirsich);
}

@media (min-width: 48rem) {
  .newsletter--lila {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--abstand-l);
  }

  .newsletter__zeile {
    flex-wrap: nowrap;
  }
}

/* ---------- zettel (Dorfanzeiger, Design: 574×247) ---------- */
.newsletter--zettel {
  padding: clamp(1.75rem, 3.5vw, 3rem) clamp(1.25rem, 2.6vw, 2.25rem) clamp(1.25rem, 2.2vw, 2rem);
}

.newsletter--zettel .newsletter__label {
  font-size: clamp(1.625rem, 2.2vw, 2rem);
  line-height: 1;
}

.newsletter--zettel .newsletter__eingabe {
  flex-basis: 21rem;
  min-height: 3.75rem;
  font-family: var(--schrift-hand);
  font-size: 1.5rem;
}

.newsletter--zettel .newsletter__knopf {
  min-height: 3.75rem;
  font-size: var(--groesse-knopf);
}
</style>
