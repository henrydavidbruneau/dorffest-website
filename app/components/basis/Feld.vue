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
}>(), { type: 'text', required: false, autocomplete: undefined, placeholder: undefined, min: undefined, max: undefined, maxlength: undefined, mehrzeilig: false })

const id = useId()
</script>

<template>
  <div class="feld">
    <label :for="id" class="feld__label">{{ label }}<span v-if="!required" class="feld__optional"> (optional)</span></label>
    <textarea
      v-if="mehrzeilig"
      :id="id"
      v-model="wert"
      :name="name"
      :required="required"
      :placeholder="placeholder"
      :maxlength="maxlength"
      rows="3"
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
      class="feld__eingabe"
    >
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
}
</style>
