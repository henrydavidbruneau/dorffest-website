<script setup lang="ts">
// Bearbeiten-Seite für einen Eintrag: laden, Formular, Speichern, Veröffentlichen, Löschen (mit Rückfrage).
// Mit `gruppen` zweispaltig: links der Text, rechts die Einstellungen, jeweils in Abschnitten.
const props = withDefaults(defineProps<{
  collection: string
  /** ID oder 'neu' */
  id: string
  felder: FeldDef[]
  /** Abschnitte; ohne Gruppen ein einfaches Formular */
  gruppen?: GruppeDef[]
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
  vorbereiten?: (daten: Record<string, unknown>, neuerStatus?: string) => Record<string, unknown>
}>(), { gruppen: undefined, beziehungen: undefined, vorlage: () => ({}), titelFeld: 'titel', veroeffentlichen: true, loeschen: true, vorbereiten: undefined })

const emit = defineEmits<{ gespeichert: [daten: Record<string, unknown>] }>()

const { zeige, fehler } = useVereinsheimMeldung()
const neu = computed(() => props.id === 'neu')
const original = ref<Record<string, unknown>>({})
const daten = ref<Record<string, unknown>>({})
const status = ref<'laedt' | 'bereit' | 'speichert'>('laedt')
const fehlend = ref<string[]>([])

async function laden() {
  status.value = 'laedt'
  try {
    original.value = neu.value
      ? { ...props.vorlage }
      // `*`: Directus liefert nur vorhandene Felder – ein noch nicht angelegtes Feld (Setup-Skript) bricht so nichts
      : await vh.eins<Record<string, unknown>>(props.collection, props.id, { fields: '*,user_updated.first_name' })
    daten.value = { ...original.value }
  }
  catch (e) {
    fehler(e)
  }
  status.value = 'bereit'
}
watch(() => props.id, laden, { immediate: true })

// Felder, die Directus beim Laden nicht mitliefert, gibt es dort noch nicht (oder sie sind nicht lesbar) –
// ausblenden und nicht mitschicken, sonst scheitert das ganze Speichern
const fehlendeFelder = computed(() => (neu.value || status.value === 'laedt' ? [] : props.felder.filter(f => !(f.feld in original.value)).map(f => f.feld)))
const sichtbareFelder = computed(() => props.felder.filter(f => !fehlendeFelder.value.includes(f.feld)))

const titel = computed(() => String(daten.value[props.titelFeld] || (neu.value ? `Neu: ${props.art}` : props.art)))

// Abschnitte mit ihren Feldern; eingeklappte gehen auf, wenn schon etwas drinsteht
const abschnitte = computed(() => (props.gruppen ?? [])
  .filter(g => !g.wenn || g.wenn(daten.value, props.beziehungen))
  .map(g => ({ ...g, felder: sichtbareFelder.value.filter(f => f.gruppe === g.key) }))
  .filter(g => g.felder.length))
const haupt = computed(() => abschnitte.value.filter(g => g.seite === 'haupt'))
const rand = computed(() => abschnitte.value.filter(g => g.seite === 'rand'))
// nach dem Laden entscheiden (nicht beim Tippen, sonst klappt der Abschnitt unter den Fingern zu)
const ausgefuellt = (felder: FeldDef[]) => felder.some((f) => {
  const w = original.value[f.feld]
  return w !== null && w !== undefined && w !== '' && w !== false && !(Array.isArray(w) && !w.length)
})
const ungespeichert = computed(() => status.value === 'bereit' && JSON.stringify(daten.value) !== JSON.stringify(original.value))
const zuletzt = computed(() => {
  const d = original.value as { date_updated?: string, user_updated?: { first_name?: string } }
  return d.date_updated ? `zuletzt bearbeitet ${datumLang(d.date_updated)}${d.user_updated?.first_name ? ` von ${d.user_updated.first_name}` : ''}` : ''
})

// Adresse (slug): eigene Eingabe umwandeln („Mein Fest“ → „mein-fest“), leer = aus dem Titel.
// Automatische Adressen bekommen bei Gleichstand -2, -3 …; eine selbst gewählte, schon vergebene meldet sich.
async function adresseVorbereiten() {
  const eigene = String(daten.value.slug ?? '').trim()
  let slug = slugAus(eigene || String(daten.value[props.titelFeld] ?? ''))
  if (!slug) {
    daten.value = { ...daten.value, slug: null }
    return true
  }
  if (slug !== original.value.slug) {
    try {
      const filter = { _and: [{ slug: { _starts_with: slug } }, ...(neu.value ? [] : [{ id: { _neq: props.id } }])] }
      const vergeben = new Set((await vh.liste<{ slug: string }>(props.collection, { fields: 'slug', filter })).map(e => e.slug))
      if (vergeben.has(slug)) {
        if (eigene) {
          zeige(`Die Adresse „${slug}“ ist schon vergeben – bitte eine andere wählen oder das Feld leer lassen.`, 'fehler')
          daten.value = { ...daten.value, slug }
          return false
        }
        let nr = 2
        while (vergeben.has(`${slug}-${nr}`)) nr++
        slug = `${slug}-${nr}`
      }
    }
    catch {
      // Prüfung klappt nicht? Dann entscheidet Directus beim Speichern (Feld ist eindeutig)
    }
  }
  daten.value = { ...daten.value, slug }
  return true
}

async function speichern(neuerStatus?: string) {
  fehlend.value = sichtbareFelder.value
    .filter(f => f.pflicht && (!f.wenn || f.wenn(daten.value)))
    .filter(f => daten.value[f.feld] === null || daten.value[f.feld] === undefined || daten.value[f.feld] === '')
    .map(f => f.label)
  if (fehlend.value.length) return
  if (props.felder.some(f => f.feld === 'slug') && !(await adresseVorbereiten())) return
  if (props.vorbereiten) daten.value = props.vorbereiten(daten.value, neuerStatus)

  status.value = 'speichert'
  const erlaubt = new Set(sichtbareFelder.value.map(f => f.feld).concat(['status', 'sort']))
  const geaendert = Object.fromEntries(Object.entries({ ...daten.value, ...(neuerStatus ? { status: neuerStatus } : {}) })
    .filter(([k, v]) => erlaubt.has(k) && (neu.value || JSON.stringify(v) !== JSON.stringify(original.value[k]))))
  try {
    if (neu.value) {
      const angelegt = await vh.anlegen<{ id: number }>(props.collection, geaendert)
      zeige(neuerStatus === 'published' ? 'Veröffentlicht!' : 'Gespeichert.')
      emit('gespeichert', { ...daten.value, id: angelegt.id })
      await navigateTo(`${props.zurueck}/${angelegt.id}`, { replace: true })
      return
    }
    if (Object.keys(geaendert).length) await vh.aendern(props.collection, props.id, geaendert)
    zeige(neuerStatus === 'published' ? 'Veröffentlicht!' : neuerStatus === 'draft' ? 'Zurückgezogen – ist jetzt wieder ein Entwurf.' : 'Gespeichert.')
    emit('gespeichert', daten.value)
    await laden()
  }
  catch (e) {
    fehler(e)
    status.value = 'bereit'
  }
}

async function wegwerfen() {
  if (!window.confirm(`„${titel.value}“ wirklich löschen? Das lässt sich nicht rückgängig machen.`)) return
  try {
    await vh.loeschen(props.collection, props.id)
    zeige('Gelöscht.')
    await navigateTo(props.zurueck)
  }
  catch (e) {
    fehler(e)
  }
}

defineExpose({ daten, speichern, ungespeichert })
</script>

<template>
  <div class="formular-seite" :class="{ 'formular-seite--zweispaltig': abschnitte.length }">
    <VereinsheimKopf
      :titel="status === 'laedt' ? art : titel"
      :zusatz="[neu ? `${art} anlegen` : `${art} bearbeiten`, zuletzt].filter(Boolean).join(' · ')"
      :zurueck="{ to: zurueck, text: 'Zur Übersicht' }"
    >
      <template v-if="veroeffentlichen && !neu && status !== 'laedt'" #meta>
        <VereinsheimStempel :status="original.status as string" />
      </template>
      <slot v-if="status !== 'laedt'" name="oben" :daten="daten" />
    </VereinsheimKopf>

    <p v-if="status === 'laedt'" class="vh-leer">Wird geladen …</p>
    <template v-else>
      <p v-if="fehlendeFelder.length" class="formular-seite__hinweis" role="note">
        Noch nicht eingerichtet: {{ felder.filter(f => fehlendeFelder.includes(f.feld)).map(f => `„${f.label}“`).join(', ') }}.
        Diese Felder gibt es in Directus noch nicht – sobald <code>scripts/directus-setup.mjs</code> gelaufen ist, erscheinen sie hier.
      </p>

      <form novalidate @submit.prevent="speichern()">
        <!-- zweispaltig in Abschnitten -->
        <div v-if="abschnitte.length" class="formular-seite__raster">
          <div class="formular-seite__spalte" data-tour="formular-haupt">
            <component
              :is="g.einklappbar ? 'details' : 'section'"
              v-for="g in haupt"
              :key="g.key"
              class="vh-karte abschnitt"
              :open="g.einklappbar ? ausgefuellt(g.felder) || undefined : undefined"
            >
              <component :is="g.einklappbar ? 'summary' : 'h2'" class="vh-karte__titel abschnitt__titel">
                {{ g.titel }}<span v-if="g.einklappbar && g.hinweis" class="abschnitt__hinweis"> · {{ g.hinweis }}</span>
              </component>
              <VereinsheimEditor v-model="daten" :felder="g.felder" :beziehungen="beziehungen" />
            </component>
            <slot :daten="daten" />
          </div>
          <aside class="formular-seite__spalte formular-seite__spalte--rand" data-tour="formular-rand">
            <component
              :is="g.einklappbar ? 'details' : 'section'"
              v-for="g in rand"
              :key="g.key"
              class="vh-karte abschnitt"
              :open="g.einklappbar ? ausgefuellt(g.felder) || undefined : undefined"
            >
              <component :is="g.einklappbar ? 'summary' : 'h2'" class="vh-karte__titel abschnitt__titel">
                {{ g.titel }}<span v-if="g.einklappbar && g.hinweis" class="abschnitt__hinweis"> · {{ g.hinweis }}</span>
              </component>
              <VereinsheimEditor v-model="daten" :felder="g.felder" :beziehungen="beziehungen" eng />
            </component>
          </aside>
        </div>

        <!-- einfach -->
        <div v-else class="vh-karte">
          <VereinsheimEditor v-model="daten" :felder="sichtbareFelder" :beziehungen="beziehungen" />
          <slot :daten="daten" />
        </div>

        <div class="formular-seite__leiste" data-tour="formular-leiste">
          <p v-if="fehlend.length" class="formular-seite__fehlend" role="alert">
            Da fehlt noch was: {{ fehlend.join(', ') }}
          </p>
          <div class="formular-seite__aktionen">
            <template v-if="veroeffentlichen">
              <BasisKnopf v-if="original.status !== 'published'" groesse="klein" :disabled="status === 'speichert'" @click="speichern('published')">
                Veröffentlichen
              </BasisKnopf>
              <BasisKnopf type="submit" groesse="klein" :variante="original.status === 'published' ? 'gefuellt' : 'outline'" :disabled="status === 'speichert'">
                {{ status === 'speichert' ? 'Speichert …' : original.status === 'published' || neu ? 'Speichern' : 'Als Entwurf speichern' }}
              </BasisKnopf>
            </template>
            <BasisKnopf v-else type="submit" groesse="klein" :disabled="status === 'speichert'">
              {{ status === 'speichert' ? 'Speichert …' : 'Speichern' }}
            </BasisKnopf>
            <slot name="aktionen" :daten="daten" />
            <span v-if="ungespeichert" class="formular-seite__ungespeichert">ungespeicherte Änderungen</span>
            <span class="formular-seite__rechts">
              <button v-if="veroeffentlichen && original.status === 'published'" type="button" class="vh-aktion" :disabled="status === 'speichert'" @click="speichern('draft')">
                Zurückziehen (Entwurf)
              </button>
              <button v-if="loeschen && !neu" type="button" class="vh-aktion vh-aktion--gefahr" @click="wegwerfen">
                Löschen
              </button>
            </span>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.formular-seite {
  max-width: 48rem;
  margin-inline: auto;
}

.formular-seite--zweispaltig {
  max-width: 76rem;
}








.formular-seite__hinweis {
  margin: 0 0 var(--abstand-m);
  padding: var(--abstand-xs) var(--abstand-s);
  border-left: 4px solid var(--farbe-orange);
  border-radius: 0.4rem;
  background: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}

.formular-seite__raster {
  display: grid;
  gap: var(--abstand-m);
  align-items: start;
}

.formular-seite__spalte {
  display: grid;
  gap: var(--abstand-m);
  min-width: 0;
}

@media (min-width: 64rem) {
  .formular-seite__raster {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }
}

.abschnitt__titel {
  font-size: var(--groesse-m);
}

summary.abschnitt__titel {
  margin: 0;
  cursor: pointer;
}

details[open] > summary.abschnitt__titel {
  margin-bottom: var(--abstand-s);
}

.abschnitt__hinweis {
  color: var(--vh-gedaempft);
  font-weight: var(--gewicht-text);
  font-size: var(--groesse-xs);
}

/* Aktionsleiste klebt unten am Fenster */
.formular-seite__leiste {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin: var(--abstand-l) calc(-1 * var(--abstand-xs)) 0;
  padding: var(--abstand-s) var(--abstand-xs);
  border-top: 1px solid var(--vh-rand);
  background: color-mix(in srgb, var(--farbe-creme) 94%, transparent);
  backdrop-filter: blur(6px);
}

.formular-seite__fehlend {
  margin: 0 0 var(--abstand-s);
  padding: var(--abstand-xs) var(--abstand-s);
  border-left: 4px solid #a1260d;
  background: var(--farbe-pfirsich);
}

.formular-seite__aktionen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-xs) var(--abstand-s);
}

.formular-seite__ungespeichert {
  color: var(--farbe-orange-text);
  font-size: var(--groesse-xs);
}

.formular-seite__rechts {
  display: flex;
  gap: var(--abstand-m);
  margin-left: auto;
  font-size: var(--groesse-xs);
}
</style>
