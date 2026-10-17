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
    v-bind="variante === 'zettel' ? { farbe: 'pfirsich', tape: 'links', drehung: -1.5 } : {}"
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
        <BasisKnopf type="submit" :variante="variante === 'lila' ? 'hell' : 'gefuellt'" groesse="klein">
          Eintragen
        </BasisKnopf>
      </div>
      <a :href="links.infochannel" target="_blank" rel="noopener" class="newsletter__infochannel handschrift">→ lieber zum Infochannel</a>
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
  font-size: var(--groesse-h3);
}

.newsletter__text {
  margin-top: var(--abstand-2xs) !important;
  font-size: var(--groesse-xs);
}

.newsletter__formular {
  display: grid;
  gap: var(--abstand-2xs);
}

.newsletter__label {
  font-size: var(--groesse-s);
}

.newsletter__zeile {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs);
}

.newsletter__eingabe {
  flex: 1 1 12rem;
  min-width: 0;
  padding: 0.5em 0.8em;
  border: 1.5px solid var(--farbe-lila);
  border-radius: var(--radius-m);
  background: var(--farbe-weiss);
  font-size: var(--groesse-s);
  color: var(--farbe-schwarz);
}

.newsletter__eingabe::placeholder {
  color: #6b6b6b;
}

.newsletter__infochannel {
  justify-self: start;
  font-size: 1.4em;
  text-decoration: none;
  color: var(--farbe-lila);
}

.newsletter__infochannel:hover {
  text-decoration: underline;
}

/* ---------- lila ---------- */
.newsletter--lila {
  --farbe-fokus: var(--farbe-gelb);
  padding: var(--abstand-m) var(--abstand-l);
  border: 2px dashed var(--farbe-pfirsich);
  border-radius: var(--radius-l);
  color: var(--farbe-pfirsich);
}

.newsletter--lila .newsletter__titel {
  color: var(--farbe-pfirsich);
}

.newsletter--lila .newsletter__eingabe {
  border-color: var(--farbe-pfirsich);
}

.newsletter--lila .newsletter__infochannel {
  color: var(--farbe-pfirsich);
}

@media (min-width: 48rem) {
  .newsletter--lila {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}

/* ---------- zettel ---------- */
.newsletter--zettel .newsletter__label {
  font-size: 1.6rem;
}

.newsletter--zettel .newsletter__eingabe {
  border: 2px dashed var(--farbe-orange);
}
</style>
