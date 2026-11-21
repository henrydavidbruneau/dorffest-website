<script setup lang="ts">
// Verteiler Zivilgesellschaft: Vereine, Initiativen und Gruppen im Ort, die Einladungen zu unseren
// Terminen bekommen (Termine → ⋯ → „Rundmail an Vereine“). Hier eintragen, ändern, pausieren, löschen.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Verteiler · Vereinsheim', robots: 'noindex, nofollow' })

const { zeige, fehler } = useVereinsheimMeldung()

const { data: kontakte, refresh, status } = useAsyncData('vh-verteiler', () => vh.liste<VerteilerKontakt>('verteiler', { fields: 'id,organisation,ansprechperson,email,aktiv,notiz', sort: 'organisation' }), { server: false, default: () => [] })
const aktive = computed(() => kontakte.value.filter(k => k.aktiv).length)

const suche = ref('')
const gefiltert = computed(() => {
  const s = suche.value.trim().toLowerCase()
  if (!s) return kontakte.value
  return kontakte.value.filter(k => [k.organisation, k.ansprechperson, k.email, k.notiz].some(f => f?.toLowerCase().includes(s)))
})

// ein Formular für „neu“ und „bearbeiten“
const leer = () => ({ organisation: '', ansprechperson: '', email: '', notiz: '' })
const form = reactive(leer())
const bearbeitet = ref<number | null>(null)
const formEl = ref<HTMLElement>()
const speichert = ref(false)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function bearbeiten(k: VerteilerKontakt) {
  bearbeitet.value = k.id
  Object.assign(form, { organisation: k.organisation, ansprechperson: k.ansprechperson ?? '', email: k.email, notiz: k.notiz ?? '' })
  formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
function abbrechen() {
  bearbeitet.value = null
  Object.assign(form, leer())
}

async function speichern() {
  const daten = {
    organisation: form.organisation.trim(),
    ansprechperson: form.ansprechperson.trim() || null,
    email: form.email.trim(),
    notiz: form.notiz.trim() || null,
  }
  if (!daten.organisation) return fehler({ statusMessage: 'Wie heißt der Verein oder die Gruppe?' })
  if (!EMAIL_RE.test(daten.email)) return fehler({ statusMessage: 'Das sieht nicht nach einer E-Mail-Adresse aus.' })
  const doppelt = kontakte.value.find(k => k.id !== bearbeitet.value && k.email.trim().toLowerCase() === daten.email.toLowerCase())
  if (doppelt) return fehler({ statusMessage: `Die Adresse steht schon drin (${doppelt.organisation}).` })
  speichert.value = true
  try {
    if (bearbeitet.value) await vh.aendern('verteiler', bearbeitet.value, daten)
    else await vh.anlegen('verteiler', { ...daten, aktiv: true })
    zeige(bearbeitet.value ? 'Gespeichert.' : `${daten.organisation} steht jetzt im Verteiler.`)
    abbrechen()
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  speichert.value = false
}

async function umschalten(k: VerteilerKontakt) {
  try {
    await vh.aendern('verteiler', k.id, { aktiv: !k.aktiv })
    zeige(k.aktiv ? `${k.organisation} bekommt vorerst keine Rundmails.` : `${k.organisation} bekommt wieder Rundmails.`)
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(k: VerteilerKontakt) {
  if (!window.confirm(`${k.organisation} (${k.email}) aus dem Verteiler löschen?`)) return
  try {
    await vh.loeschen('verteiler', k.id)
    if (bearbeitet.value === k.id) abbrechen()
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

function csv() {
  csvHerunterladen('verteiler.csv', ['Organisation', 'Ansprechperson', 'E-Mail', 'Aktiv', 'Notiz'],
    kontakte.value.map(k => [k.organisation, k.ansprechperson, k.email, k.aktiv ? 'ja' : 'nein', k.notiz]))
}
</script>

<template>
  <div class="vt">
    <VereinsheimKopf hervorhebung="Verteiler" zusatz="Vereine, Initiativen und Gruppen, die wir zu Terminen einladen">
      <BasisKnopf v-if="kontakte.length" variante="outline" groesse="klein" @click="csv">CSV</BasisKnopf>
    </VereinsheimKopf>

    <p class="vt__info">
      Wer hier steht, bekommt Einladungen zu unseren Terminen: in der Terminliste beim jeweiligen Termin über
      <strong>⋯ → Rundmail an Vereine</strong>. Alle bekommen denselben Text, aber jede Adresse einzeln – niemand sieht die anderen.
    </p>

    <form ref="formEl" class="vh-karte vt__form" novalidate @submit.prevent="speichern">
      <h2>{{ bearbeitet ? 'Eintrag ändern' : 'Neu in den Verteiler' }}</h2>
      <div class="vt__felder">
        <BasisFeld v-model="form.organisation" label="Verein / Gruppe" name="organisation" required :maxlength="160" placeholder="z.B. Freiwillige Feuerwehr" />
        <BasisFeld v-model="form.ansprechperson" label="Ansprechperson" name="ansprechperson" :maxlength="120" hinweis="freiwillig, nur für uns" />
        <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" required :maxlength="254" />
        <BasisFeld v-model="form.notiz" label="Notiz (intern)" name="notiz" :maxlength="500" />
      </div>
      <div class="vt__knoepfe">
        <BasisKnopf type="submit" groesse="klein" :disabled="speichert">{{ bearbeitet ? 'Speichern' : '+ Hinzufügen' }}</BasisKnopf>
        <BasisKnopf v-if="bearbeitet" variante="outline" groesse="klein" @click="abbrechen">Abbrechen</BasisKnopf>
      </div>
    </form>

    <div class="vt__kopf">
      <h2>Im Verteiler · {{ aktive }}<template v-if="aktive !== kontakte.length"> aktiv von {{ kontakte.length }}</template></h2>
      <label v-if="kontakte.length > 8" class="vt__suche">
        <span class="nur-screenreader">Suchen</span>
        <input v-model="suche" type="search" placeholder="Suchen …">
      </label>
    </div>

    <p v-if="status === 'pending'" class="vh-leer">Wird geladen …</p>
    <p v-else-if="!kontakte.length" class="vh-leer vh-karte">Noch leer. Trag oben den ersten Verein ein!</p>
    <p v-else-if="!gefiltert.length" class="vh-leer">Nichts gefunden.</p>
    <ul v-else class="vt__liste">
      <li v-for="k in gefiltert" :key="k.id" class="vh-karte vt__eintrag" :class="{ 'vt__eintrag--aus': !k.aktiv, 'vt__eintrag--bearbeitet': bearbeitet === k.id }">
        <div class="vt__text">
          <p class="vt__name">{{ k.organisation }}<span v-if="!k.aktiv" class="vt__pause">pausiert</span></p>
          <p class="vt__meta">
            <span v-if="k.ansprechperson">{{ k.ansprechperson }}</span>
            <a :href="`mailto:${k.email}`">{{ k.email }}</a>
          </p>
          <p v-if="k.notiz" class="vt__notiz">{{ k.notiz }}</p>
        </div>
        <div class="vt__aktionen">
          <button type="button" @click="bearbeiten(k)">Bearbeiten</button>
          <button type="button" @click="umschalten(k)">{{ k.aktiv ? 'Pausieren' : 'Wieder aktiv' }}</button>
          <button type="button" class="vt__weg" @click="loeschen(k)">Löschen</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.vt {
  max-width: 56rem;
  margin-inline: auto;
}

.vt__info {
  margin: 0 0 var(--abstand-m);
  font-size: var(--groesse-s);
}

.vt__form h2,
.vt__kopf h2 {
  margin: 0 0 var(--abstand-s);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.vt__felder {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--abstand-s);
}

.vt__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-top: var(--abstand-s);
}

.vt__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--abstand-xs);
  margin-top: var(--abstand-xl);
}

.vt__suche input {
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  font: inherit;
  font-size: var(--groesse-s);
}

.vt__liste {
  display: grid;
  gap: var(--abstand-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.vt__eintrag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-xs) var(--abstand-m);
}

.vt__eintrag--aus {
  opacity: 0.6;
}

.vt__eintrag--bearbeitet {
  outline: 2px solid var(--farbe-flieder);
}

.vt__text {
  min-width: 0;
}

.vt__name {
  margin: 0;
  font-weight: var(--gewicht-text-mittel);
}

.vt__pause {
  margin-left: 0.5rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: var(--vh-rand);
  font-size: var(--groesse-xs);
  font-weight: normal;
}

.vt__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--abstand-s);
  margin: 0.15rem 0 0;
  font-size: var(--groesse-s);
  overflow-wrap: anywhere;
}

.vt__notiz {
  margin: 0.25rem 0 0;
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.vt__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
}

.vt__aktionen button {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-weiss);
  font: inherit;
  font-size: var(--groesse-xs);
  cursor: pointer;
}

.vt__aktionen button:hover {
  border-color: var(--farbe-lila);
}

.vt__aktionen .vt__weg {
  color: #a1260d;
}
</style>
