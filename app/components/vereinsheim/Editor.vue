<script setup lang="ts">
// Formular aus einer Feldliste (app/utils/vereinsheimFelder.ts). Hält die Werte im Format
// von Directus (Zeitpunkte als ISO, Tags als Liste) und rechnet nur für die Eingabe um.
const daten = defineModel<Record<string, unknown>>({ required: true })
const props = defineProps<{
  felder: FeldDef[]
  /** Optionen für Felder vom Typ `beziehung`: feld → { id: Beschriftung } */
  beziehungen?: Record<string, Record<string, string>>
  /** schmale Spalte: alles untereinander */
  eng?: boolean
}>()

const sichtbar = computed(() => props.felder.filter(f => !f.wenn || f.wenn(daten.value)))

function wert(f: FeldDef) {
  return computed({
    get() {
      const w = daten.value[f.feld]
      if (f.typ === 'zeitpunkt') return isoZuOrtszeit(w as string | null)
      if (f.typ === 'datum') return typeof w === 'string' ? w.slice(0, 10) : ''
      if (f.typ === 'tags') return Array.isArray(w) ? w.join(', ') : ''
      if (f.typ === 'beziehung' && w && typeof w === 'object') return String((w as { id: unknown }).id)
      return w == null ? '' : (w as string | number)
    },
    set(neu: string | number) {
      let ergebnis: unknown = neu
      if (f.typ === 'zeitpunkt') ergebnis = ortszeitZuIso(String(neu))
      else if (f.typ === 'datum') ergebnis = neu || null
      else if (f.typ === 'zahl') ergebnis = neu === '' || neu == null ? null : Number(neu)
      else if (f.typ === 'tags') ergebnis = String(neu).split(',').map(t => t.trim()).filter(Boolean)
      else if (f.typ === 'beziehung') ergebnis = neu === '' ? null : (/^\d+$/.test(String(neu)) ? Number(neu) : neu)
      else if (typeof neu === 'string' && neu === '' && !f.pflicht) ergebnis = null
      daten.value = { ...daten.value, [f.feld]: ergebnis }
    },
  })
}

const werte = computed(() => Object.fromEntries(props.felder.map(f => [f.feld, wert(f)])))

const optionen = (f: FeldDef) => {
  const liste = f.typ === 'beziehung' ? props.beziehungen?.[f.feld] ?? {} : f.optionen ?? {}
  return f.pflicht ? liste : { '': '– nichts –', ...liste }
}

const EINGABETYP: Partial<Record<FeldDef['typ'], string>> = { zahl: 'number', datum: 'date', zeitpunkt: 'datetime-local', email: 'email' }
</script>

<template>
  <div class="editor" :class="{ 'editor--eng': eng }">
    <template v-for="f in sichtbar" :key="f.feld">
      <label v-if="f.typ === 'janein'" class="editor__janein" :class="{ 'editor__feld--breit': f.breit }">
        <input type="checkbox" :checked="!!daten[f.feld]" @change="daten = { ...daten, [f.feld]: ($event.target as HTMLInputElement).checked }">
        <span>{{ f.label }}<small v-if="f.hinweis"><br>{{ f.hinweis }}</small></span>
      </label>
      <VereinsheimBildFeld
        v-else-if="f.typ === 'bild'"
        :model-value="(daten[f.feld] as string | null) ?? null"
        :label="f.label"
        :ordner="f.ordner ?? 'artikel'"
        :hinweis="f.hinweis"
        class="editor__feld"
        @update:model-value="daten = { ...daten, [f.feld]: $event }"
      />
      <VereinsheimMarkdownFeld
        v-else-if="f.typ === 'markdown'"
        :model-value="(daten[f.feld] as string | null) ?? ''"
        :label="f.label"
        :hinweis="f.hinweis"
        :pflicht="f.pflicht"
        class="editor__feld editor__feld--breit"
        @update:model-value="daten = { ...daten, [f.feld]: $event }"
      />
      <BasisFeld
        v-else
        v-model="werte[f.feld]!.value"
        :label="f.label"
        :name="f.feld"
        :type="EINGABETYP[f.typ] ?? 'text'"
        :required="f.pflicht"
        :hinweis="f.hinweis"
        :maxlength="f.maxlength"
        :mehrzeilig="f.typ === 'mehrzeilig'"
        :zeilen="4"
        :optionen="f.typ === 'auswahl' || f.typ === 'beziehung' ? optionen(f) : undefined"
        class="editor__feld"
        :class="{ 'editor__feld--breit': f.breit || f.typ === 'mehrzeilig', 'editor__feld--gross': f.gross }"
      />
    </template>
  </div>
</template>

<style scoped>
.editor {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--abstand-m) var(--abstand-l);
}

/* in der schmalen Randspalte alles untereinander */
.editor--eng {
  grid-template-columns: 1fr;
  gap: var(--abstand-s);
}

.editor__feld--breit {
  grid-column: 1 / -1;
}

.editor__janein {
  display: flex;
  align-items: flex-start;
  gap: var(--abstand-xs);
  align-self: center;
  cursor: pointer;
}

.editor__janein input {
  width: 1.3rem;
  height: 1.3rem;
  margin-top: 0.15rem;
  accent-color: var(--farbe-lila);
}

.editor__janein small {
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}
</style>
