<script setup lang="ts">
// "Was bringst du mit?": Einleitung, antippbare Vorschläge und Freitextfeld
const was = defineModel<string>({ default: '' })
defineProps<{
  termin: Termin
  /** Pflichtfeld (ohne Anmeldung) oder freiwillig (als zweite Seite der Anmeldung) */
  pflicht?: boolean
}>()

const teile = computed(() => was.value.split(',').map(t => t.trim()).filter(Boolean))

function umschalten(v: string) {
  was.value = teile.value.includes(v) ? teile.value.filter(t => t !== v).join(', ') : [...teile.value, v].join(', ')
}
</script>

<template>
  <div class="mitbring">
    <p v-if="termin.mitbringen_text" class="mitbring__text">{{ termin.mitbringen_text }}</p>
    <div v-if="termin.mitbringen_vorschlaege?.length" class="mitbring__vorschlaege" role="group" aria-label="Vorschläge zum Mitbringen">
      <button
        v-for="v in termin.mitbringen_vorschlaege"
        :key="v"
        type="button"
        class="mitbring__chip"
        :aria-pressed="teile.includes(v)"
        @click="umschalten(v)"
      >
        {{ v }}
      </button>
    </div>
    <BasisFeld
      v-model="was"
      label="Was bringst du mit?"
      name="mitbringen"
      :required="pflicht"
      :maxlength="200"
      placeholder="z.B. ein Blech Plätzchen"
    />
  </div>
</template>

<style scoped>
.mitbring {
  display: grid;
  gap: var(--abstand-s);
}

.mitbring__text {
  margin: 0;
  font-weight: var(--gewicht-text-normal);
}

.mitbring__vorschlaege {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mitbring__chip {
  padding: 0.45em 1em;
  border: 2px solid var(--farbe-lila);
  border-radius: 999px;
  background: transparent;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-s);
  text-transform: uppercase;
  color: var(--farbe-lila);
  cursor: pointer;
  transition: background-color var(--dauer-kurz) ease, color var(--dauer-kurz) ease;
}

.mitbring__chip[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-pfirsich);
}

.mitbring__chip[aria-pressed='true']::before {
  content: '✓ ';
}
</style>
