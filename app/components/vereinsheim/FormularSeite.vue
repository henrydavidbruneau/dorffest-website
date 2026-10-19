<script setup lang="ts">
// Bearbeiten-Seite für einen Eintrag: laden, Formular, „Ab ins Fach“ (speichern),
// „Ans Brett hängen“ (veröffentlichen), „In den Papierkorb“ (löschen mit Rückfrage).
const props = withDefaults(defineProps<{
  collection: string
  /** ID oder 'neu' */
  id: string
  felder: FeldDef[]
  beziehungen?: Record<string, Record<string, string>>
  /** Startwerte für neue Einträge */
  vorlage?: Record<string, unknown>
  /** Basis-Adresse der Liste, z.B. /vereinsheim/termine */
  zurueck: string
  /** Name des Eintrags für Überschrift/Meldungen, z.B. „Termin“ */
  art: string
  /** Felder für die Überschrift */
  titelFeld?: string
  /** hat draft/published-Status (sonst nur speichern) */
  veroeffentlichen?: boolean
  loeschen?: boolean
  /** Daten vor dem Speichern ergänzen (z.B. Lesedauer schätzen) */
  vorbereiten?: (daten: Record<string, unknown>) => Record<string, unknown>
}>(), { beziehungen: undefined, vorlage: () => ({}), titelFeld: 'titel', veroeffentlichen: true, loeschen: true, vorbereiten: undefined })

const emit = defineEmits<{ gespeichert: [daten: Record<string, unknown>] }>()

const { zeige, fehler } = useVereinsheimMeldung()
const neu = computed(() => props.id === 'neu')
const original = ref<Record<string, unknown>>({})
const daten = ref<Record<string, unknown>>({})
const status = ref<'laedt' | 'bereit' | 'speichert'>('laedt')
const fehlend = ref<string[]>([])

const felderNamen = computed(() => [...new Set(['id', 'status', 'date_updated', 'user_updated.first_name', ...props.felder.map(f => f.feld)])])

async function laden() {
  status.value = 'laedt'
  try {
    original.value = neu.value
      ? { ...props.vorlage }
      : await vh.eins<Record<string, unknown>>(props.collection, props.id, { fields: felderNamen.value.join(',') })
    daten.value = { ...original.value }
  }
  catch (e) {
    fehler(e)
  }
  status.value = 'bereit'
}
watch(() => props.id, laden, { immediate: true })

const titel = computed(() => String(daten.value[props.titelFeld] || (neu.value ? `Neuer ${props.art}` : props.art)))
const zuletzt = computed(() => {
  const d = original.value as { date_updated?: string, user_updated?: { first_name?: string } }
  return d.date_updated ? `zuletzt bearbeitet ${datumLang(d.date_updated)}${d.user_updated?.first_name ? ` von ${d.user_updated.first_name}` : ''}` : ''
})

async function speichern(neuerStatus?: string) {
  if (daten.value.slug === '' || (daten.value.slug == null && props.felder.some(f => f.feld === 'slug'))) {
    daten.value = { ...daten.value, slug: slugAus(String(daten.value[props.titelFeld] ?? '')) }
  }
  fehlend.value = props.felder
    .filter(f => f.pflicht && (!f.wenn || f.wenn(daten.value)))
    .filter(f => daten.value[f.feld] === null || daten.value[f.feld] === undefined || daten.value[f.feld] === '')
    .map(f => f.label)
  if (fehlend.value.length) return
  if (props.vorbereiten) daten.value = props.vorbereiten(daten.value)

  status.value = 'speichert'
  const erlaubt = new Set(props.felder.map(f => f.feld).concat(['status', 'sort']))
  const geaendert = Object.fromEntries(Object.entries({ ...daten.value, ...(neuerStatus ? { status: neuerStatus } : {}) })
    .filter(([k, v]) => erlaubt.has(k) && (neu.value || JSON.stringify(v) !== JSON.stringify(original.value[k]))))
  try {
    if (neu.value) {
      const angelegt = await vh.anlegen<{ id: number }>(props.collection, geaendert)
      zeige(neuerStatus === 'published' ? 'Hängt am Brett!' : 'Ab ins Fach!')
      emit('gespeichert', { ...daten.value, id: angelegt.id })
      await navigateTo(`${props.zurueck}/${angelegt.id}`, { replace: true })
      return
    }
    if (Object.keys(geaendert).length) await vh.aendern(props.collection, props.id, geaendert)
    zeige(neuerStatus === 'published' ? 'Hängt am Brett!' : neuerStatus === 'draft' ? 'Wieder abgehängt – liegt im Fach.' : 'Ab ins Fach!')
    emit('gespeichert', daten.value)
    await laden()
  }
  catch (e) {
    fehler(e)
    status.value = 'bereit'
  }
}

async function wegwerfen() {
  if (!window.confirm(`Wirklich in den Papierkorb? „${titel.value}“ ist dann weg – das lässt sich nicht rückgängig machen.`)) return
  try {
    await vh.loeschen(props.collection, props.id)
    zeige('Zerknüllt und weg.')
    await navigateTo(props.zurueck)
  }
  catch (e) {
    fehler(e)
  }
}

defineExpose({ daten, speichern })
</script>

<template>
  <div class="formular-seite">
    <NuxtLink :to="zurueck" class="formular-seite__zurueck handschrift">← zurück</NuxtLink>
    <BasisNotizzettel farbe="creme" tape="mitte" tape-farbe="gelb" :drehung="-0.4" class="formular-seite__blatt">
      <p v-if="status === 'laedt'" class="handschrift formular-seite__laedt">Moment, ich such’s raus …</p>
      <template v-else>
        <header class="formular-seite__kopf">
          <div>
            <p class="formular-seite__art handschrift">{{ art }}</p>
            <h1 class="formular-seite__titel">{{ titel }}</h1>
            <p v-if="zuletzt" class="formular-seite__zuletzt">{{ zuletzt }}</p>
          </div>
          <VereinsheimStempel v-if="veroeffentlichen && !neu" :status="original.status as string" />
        </header>

        <slot name="oben" :daten="daten" />

        <form novalidate @submit.prevent="speichern()">
          <VereinsheimEditor v-model="daten" :felder="felder" :beziehungen="beziehungen" />
          <slot :daten="daten" />

          <p v-if="fehlend.length" class="formular-seite__fehlend" role="alert">
            Da fehlt noch was: {{ fehlend.join(', ') }}
          </p>
          <div class="formular-seite__aktionen">
            <BasisKnopf type="submit" variante="outline" :disabled="status === 'speichert'">
              {{ status === 'speichert' ? 'Wird abgelegt …' : 'Ab ins Fach (speichern)' }}
            </BasisKnopf>
            <template v-if="veroeffentlichen">
              <BasisKnopf v-if="original.status !== 'published'" :disabled="status === 'speichert'" @click="speichern('published')">
                Ans Brett hängen (veröffentlichen)
              </BasisKnopf>
              <BasisKnopf v-else variante="outline" :disabled="status === 'speichert'" @click="speichern('draft')">
                Wieder abhängen (Entwurf)
              </BasisKnopf>
            </template>
            <button v-if="loeschen && !neu" type="button" class="formular-seite__papierkorb" @click="wegwerfen">
              🗑️ In den Papierkorb
            </button>
          </div>
        </form>
      </template>
    </BasisNotizzettel>
  </div>
</template>

<style scoped>
.formular-seite {
  max-width: 62rem;
  margin-inline: auto;
}

.formular-seite__zurueck {
  display: inline-block;
  margin-bottom: var(--abstand-s);
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  color: var(--farbe-schwarz);
  font-size: var(--groesse-hand-m);
  text-decoration: none;
}

.formular-seite__blatt {
  padding: var(--abstand-l) clamp(1rem, 4vw, 3rem) var(--abstand-l);
}

.formular-seite__laedt {
  font-size: var(--groesse-hand-l);
}

.formular-seite__kopf {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--abstand-m);
  margin-bottom: var(--abstand-l);
}

.formular-seite__art {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.formular-seite__titel {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1;
  color: var(--farbe-lila);
}

.formular-seite__zuletzt {
  margin: var(--abstand-2xs) 0 0;
  font-size: var(--groesse-xs);
}

.formular-seite__fehlend {
  margin: var(--abstand-m) 0 0;
  padding: var(--abstand-xs) var(--abstand-s);
  background: var(--farbe-pfirsich);
  border-left: 4px solid #a1260d;
}

.formular-seite__aktionen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s);
  margin-top: var(--abstand-l);
  padding-top: var(--abstand-m);
  border-top: 2px dashed var(--farbe-spaltenlinie);
}

.formular-seite__papierkorb {
  margin-left: auto;
  padding: 0.4rem 0.8rem;
  border: 0;
  background: none;
  color: #a1260d;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
