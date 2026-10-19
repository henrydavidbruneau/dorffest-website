<script setup lang="ts">
// Markdown schreiben, mit Werkzeugleiste (fett, Überschrift, Link …) und Vorschau wie auf der Website (Server rendert)
const wert = defineModel<string | null>()
defineProps<{ label: string, hinweis?: string, pflicht?: boolean }>()
const id = useId()
const ansicht = ref<'schreiben' | 'vorschau'>('schreiben')
const html = ref('')
const feld = ref<HTMLTextAreaElement | null>(null)

async function vorschau() {
  ansicht.value = 'vorschau'
  html.value = (await $fetch<{ html: string }>('/api/vereinsheim/vorschau', { method: 'POST', body: { markdown: wert.value ?? '' } }).catch(() => ({ html: '<p>Vorschau gerade nicht möglich.</p>' }))).html
}

// Auswahl umschließen (fett, kursiv, Link) oder Zeilenanfang setzen (Überschrift, Zitat, Liste)
type Werkzeug = { text: string, titel: string, vor: string, nach?: string, zeile?: boolean, platzhalter: string }
const WERKZEUGE: Werkzeug[] = [
  { text: 'B', titel: 'Fett', vor: '**', nach: '**', platzhalter: 'fetter Text' },
  { text: 'I', titel: 'Kursiv', vor: '*', nach: '*', platzhalter: 'kursiver Text' },
  { text: 'H', titel: 'Zwischenüberschrift', vor: '## ', zeile: true, platzhalter: 'Zwischenüberschrift' },
  { text: '🔗', titel: 'Link', vor: '[', nach: '](https://)', platzhalter: 'Linktext' },
  { text: '❝', titel: 'Zitat', vor: '> ', zeile: true, platzhalter: 'Zitat' },
  { text: '•', titel: 'Aufzählung', vor: '- ', zeile: true, platzhalter: 'Punkt' },
]

async function anwenden(w: Werkzeug) {
  const el = feld.value
  if (!el) return
  const text = wert.value ?? ''
  const [a, b] = [el.selectionStart, el.selectionEnd]
  const auswahl = text.slice(a, b) || w.platzhalter
  let neu: string
  let start: number
  if (w.zeile) {
    const zeilenanfang = text.lastIndexOf('\n', a - 1) + 1
    const vorher = text.slice(0, zeilenanfang)
    const zeile = text.slice(zeilenanfang, b) || w.platzhalter
    neu = `${vorher}${w.vor}${zeile}${text.slice(Math.max(b, zeilenanfang))}`
    start = zeilenanfang + w.vor.length
    wert.value = neu
    await nextTick()
    el.focus()
    el.setSelectionRange(start, start + zeile.length)
    return
  }
  neu = `${text.slice(0, a)}${w.vor}${auswahl}${w.nach ?? ''}${text.slice(b)}`
  start = a + w.vor.length
  wert.value = neu
  await nextTick()
  el.focus()
  el.setSelectionRange(start, start + auswahl.length)
}
</script>

<template>
  <div class="md">
    <label :for="id" class="md__label vh-label">{{ label }}<span v-if="!pflicht" class="md__optional"> (optional)</span></label>
    <div class="md__rahmen">
      <div class="md__leiste">
        <div v-show="ansicht === 'schreiben'" class="md__werkzeuge" role="toolbar" :aria-label="`Formatieren: ${label}`">
          <button v-for="w in WERKZEUGE" :key="w.titel" type="button" class="md__werkzeug" :title="w.titel" :aria-label="w.titel" @click="anwenden(w)">
            <span :class="`md__symbol md__symbol--${w.titel.toLowerCase()}`" aria-hidden="true">{{ w.text }}</span>
          </button>
        </div>
        <div class="md__umschalter" role="group" aria-label="Ansicht">
          <button type="button" :aria-pressed="ansicht === 'schreiben'" @click="ansicht = 'schreiben'">Schreiben</button>
          <button type="button" :aria-pressed="ansicht === 'vorschau'" @click="vorschau">Vorschau</button>
        </div>
      </div>
      <textarea v-show="ansicht === 'schreiben'" :id="id" ref="feld" v-model="wert" rows="16" class="md__eingabe" />
      <!-- eslint-disable-next-line vue/no-v-html -- vom eigenen Server gerendert, rohes HTML wird dort escaped -->
      <div v-if="ansicht === 'vorschau'" class="md__vorschau vh-text" v-html="html" />
    </div>
    <p v-if="hinweis" class="md__hinweis">Leerzeile = neuer Absatz · {{ hinweis }}</p>
  </div>
</template>

<style scoped>
.md {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.md__optional {
  color: var(--vh-gedaempft);
}

.md__rahmen {
  overflow: hidden;
  border: 1.5px solid var(--vh-rand-stark);
  border-radius: 0.6rem;
  background: var(--farbe-weiss);
}

.md__rahmen:focus-within {
  border-color: var(--farbe-lila);
  box-shadow: 0 0 0 3px rgb(122 42 126 / 0.18);
}

.md__leiste {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  padding: 0.3rem;
  border-bottom: 1px solid var(--vh-rand);
  background: #faf6ef;
}

.md__werkzeuge {
  display: flex;
  gap: 0.15rem;
}

.md__werkzeug {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 0;
  border-radius: 0.4rem;
  background: none;
  font: inherit;
  font-weight: var(--gewicht-text-fett);
  cursor: pointer;
}

.md__werkzeug:hover {
  background: var(--farbe-pfirsich);
}

.md__symbol--kursiv {
  font-style: italic;
  font-family: Georgia, serif;
}

.md__umschalter {
  display: flex;
  margin-left: auto;
  padding: 0.15rem;
  border-radius: 999px;
  background: var(--farbe-weiss);
  border: 1px solid var(--vh-rand);
}

.md__umschalter button {
  padding: 0.25rem 0.8rem;
  border: 0;
  border-radius: 999px;
  background: none;
  font: inherit;
  font-size: var(--groesse-xs);
  cursor: pointer;
}

.md__umschalter button[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.md__eingabe {
  display: block;
  width: 100%;
  padding: var(--abstand-s);
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--groesse-s);
  line-height: 1.7;
  resize: vertical;
}

.md__eingabe:focus {
  outline: none;
}

.md__vorschau {
  min-height: 12rem;
  padding: var(--abstand-m);
  background: var(--farbe-zeitungspapier);
}

.md__hinweis {
  margin: 0;
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}
</style>
