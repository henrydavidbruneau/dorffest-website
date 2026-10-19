<script setup lang="ts">
// Markdown schreiben, mit Vorschau so wie auf der Website (Server rendert)
const wert = defineModel<string | null>()
defineProps<{ label: string, hinweis?: string, pflicht?: boolean }>()
const id = useId()
const ansicht = ref<'schreiben' | 'vorschau'>('schreiben')
const html = ref('')

async function vorschau() {
  ansicht.value = 'vorschau'
  html.value = (await $fetch<{ html: string }>('/api/vereinsheim/vorschau', { method: 'POST', body: { markdown: wert.value ?? '' } }).catch(() => ({ html: '<p>Vorschau gerade nicht möglich.</p>' }))).html
}
</script>

<template>
  <div class="md">
    <div class="md__kopf">
      <label :for="id" class="md__label">{{ label }}<span v-if="!pflicht" class="md__optional"> (optional)</span></label>
      <div class="md__umschalter" role="group" aria-label="Ansicht">
        <button type="button" :aria-pressed="ansicht === 'schreiben'" @click="ansicht = 'schreiben'">Schreiben</button>
        <button type="button" :aria-pressed="ansicht === 'vorschau'" @click="vorschau">Vorschau</button>
      </div>
    </div>
    <textarea v-show="ansicht === 'schreiben'" :id="id" v-model="wert" rows="14" class="md__eingabe" />
    <!-- eslint-disable-next-line vue/no-v-html -- vom eigenen Server gerendert, rohes HTML wird dort escaped -->
    <div v-if="ansicht === 'vorschau'" class="md__vorschau vh-text" v-html="html" />
    <p v-if="hinweis" class="md__hinweis">{{ hinweis }} · **fett**, *kursiv*, [Link](https://…), Leerzeile = neuer Absatz</p>
  </div>
</template>

<style scoped>
.md {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
}

.md__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-2xs);
}

.md__label {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  text-transform: uppercase;
}

.md__optional {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text);
  text-transform: none;
}

.md__umschalter {
  display: flex;
}

.md__umschalter button {
  padding: 0.25rem 0.8rem;
  border: 1.5px solid var(--farbe-lila);
  background: var(--farbe-weiss);
  color: var(--farbe-lila);
  font: inherit;
  font-size: var(--groesse-xs);
  cursor: pointer;
}

.md__umschalter button:first-child {
  border-radius: var(--radius-m) 0 0 var(--radius-m);
}

.md__umschalter button:last-child {
  border-left: 0;
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
}

.md__umschalter button[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.md__eingabe {
  width: 100%;
  padding: var(--abstand-xs);
  border: 2px dashed var(--farbe-orange);
  border-radius: var(--radius-m);
  background: var(--farbe-weiss);
  font: inherit;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.md__vorschau {
  min-height: 10rem;
  padding: var(--abstand-m);
  border: 1.5px solid var(--farbe-spaltenlinie);
  background: var(--farbe-zeitungspapier);
}

.md__hinweis {
  margin: 0;
  font-size: var(--groesse-xs);
}
</style>
