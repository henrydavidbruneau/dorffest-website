<script setup lang="ts">
// Beschriftetes Eingabefeld im Stil der Seite (gestrichelter oranger Rahmen)
const wert = defineModel<string | number>()
withDefaults(defineProps<{
  label: string
  type?: string
  name: string
  required?: boolean
  autocomplete?: string
  placeholder?: string
  min?: number
  max?: number
  maxlength?: number
  mehrzeilig?: boolean
  /** Höhe des mehrzeiligen Felds */
  zeilen?: number
  /** Auswahlliste statt Eingabe: Wert → Beschriftung */
  optionen?: Record<string, string>
  /** kleiner Hinweis unter dem Feld */
  hinweis?: string
}>(), { type: 'text', required: false, autocomplete: undefined, placeholder: undefined, min: undefined, max: undefined, maxlength: undefined, mehrzeilig: false, zeilen: 3, optionen: undefined, hinweis: undefined })

const id = useId()
const hinweisId = `${id}-hinweis`
</script>

<template>
  <div class="feld">
    <label :for="id" class="feld__label">{{ label }}<span v-if="!required" class="feld__optional"> (optional)</span></label>
    <select
      v-if="optionen"
      :id="id"
      v-model="wert"
      :name="name"
      :required="required"
      :aria-describedby="hinweis ? hinweisId : undefined"
      class="feld__eingabe feld__auswahl"
    >
      <option v-for="(beschriftung, schluessel) in optionen" :key="schluessel" :value="schluessel">{{ beschriftung }}</option>
    </select>
    <textarea
      v-else-if="mehrzeilig"
      :id="id"
      v-model="wert"
      :name="name"
      :required="required"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :rows="zeilen"
      :aria-describedby="hinweis ? hinweisId : undefined"
      class="feld__eingabe"
    />
    <input
      v-else
      :id="id"
      v-model="wert"
      :type="type"
      :name="name"
      :required="required"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :maxlength="maxlength"
      :aria-describedby="hinweis ? hinweisId : undefined"
      class="feld__eingabe"
    >
    <p v-if="hinweis" :id="hinweisId" class="feld__hinweis">{{ hinweis }}</p>
  </div>
</template>

<style scoped>
.feld {
  display: grid;
  gap: 0.35rem;
}

.feld__label {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-s);
  text-transform: uppercase;
}

.feld__optional {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text);
  font-size: var(--groesse-xs);
  text-transform: none;
}

.feld__eingabe {
  width: 100%;
  min-height: 3rem;
  padding: 0.6em 0.9em;
  border: 2px dashed var(--farbe-orange);
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  font-size: var(--groesse-s);
  color: var(--farbe-schwarz);
}

textarea.feld__eingabe {
  resize: vertical;
  line-height: 1.6;
}

.feld__auswahl {
  appearance: none;
  padding-right: 2.5em;
  background-image: linear-gradient(45deg, transparent 50%, var(--farbe-orange) 50%), linear-gradient(-45deg, transparent 50%, var(--farbe-orange) 50%);
  background-position: right 1.25em center, right 0.85em center;
  background-size: 0.4em 0.4em;
  background-repeat: no-repeat;
  cursor: pointer;
}

.feld__hinweis {
  margin: 0;
  font-size: var(--groesse-xs);
  line-height: 1.45;
}
</style>
