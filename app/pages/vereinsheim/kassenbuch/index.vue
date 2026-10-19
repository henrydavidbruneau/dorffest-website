<script setup lang="ts">
// Kassenbuch: Auslagen einreichen (mit Belegen), eigene sehen; der Vorstand sieht alle und stempelt
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Kassenbuch · Vereinsheim', robots: 'noindex, nofollow' })

interface Auslage {
  id: number, status: string, titel: string, betrag: string | number, datum: string, notiz: string | null
  kontoinhaber_in: string | null, iban: string | null
  termin: { titel: string } | null
  user_created: { id: string, first_name: string | null, last_name: string | null } | null
  belege: { directus_files_id: { id: string, filename_download: string } | null }[]
}

const { ich } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const STATUS = { eingereicht: 'eingereicht', genehmigt: 'genehmigt', ausgezahlt: 'ausgezahlt', abgelehnt: 'abgelehnt' }

const { data, refresh } = useAsyncData('vh-kassenbuch', async () => {
  const [auslagen, termine] = await Promise.all([
    vh.liste<Auslage>('auslagen', {
      fields: 'id,status,titel,betrag,datum,notiz,kontoinhaber_in,iban,termin.titel,user_created.id,user_created.first_name,user_created.last_name,belege.directus_files_id.id,belege.directus_files_id.filename_download',
      sort: '-datum,-id',
    }),
    vh.liste<{ id: number, titel: string, beginn: string | null }>('termine', { fields: 'id,titel,beginn', sort: '-beginn', limit: 40 }),
  ])
  return { auslagen, termine: Object.fromEntries(termine.map(t => [t.id, `${t.titel}${t.beginn ? ` (${datumLang(t.beginn)})` : ''}`])) }
}, { server: false, default: () => ({ auslagen: [], termine: {} }) })

const filter = ref<'offen' | 'alle'>('offen')
const liste = computed(() => filter.value === 'offen' ? data.value.auslagen.filter(a => a.status === 'eingereicht' || a.status === 'genehmigt') : data.value.auslagen)
const summeOffen = computed(() => data.value.auslagen.filter(a => a.status === 'eingereicht' || a.status === 'genehmigt').reduce((s, a) => s + Number(a.betrag || 0), 0))

// ---------- einreichen ----------
const leer = () => ({ titel: '', betrag: null, datum: new Date().toISOString().slice(0, 10), termin: null, kontoinhaber_in: [ich.value?.first_name, ich.value?.last_name].filter(Boolean).join(' ') || null, iban: null, notiz: null })
const neu = ref<Record<string, unknown>>(leer())
const belege = ref<File[]>([])
const sendet = ref(false)
const offenesFormular = ref(false)

async function einreichen() {
  const fehlt = FELDER_AUSLAGE.filter(f => f.pflicht && !neu.value[f.feld]).map(f => f.label)
  if (fehlt.length) return fehler({ statusMessage: `Da fehlt noch was: ${fehlt.join(', ')}` })
  if (!belege.value.length && !window.confirm('Ohne Beleg einreichen? Der Vorstand braucht eigentlich ein Foto vom Kassenbon.')) return
  sendet.value = true
  try {
    const ids: string[] = []
    for (const b of belege.value) {
      const datei = b.type.startsWith('image/') ? await fotoVerkleinern(b, 2000) : b
      ids.push(await vh.hochladen(datei, b.type.startsWith('image/') ? b.name.replace(/\.\w+$/, '.jpg') : b.name, 'belege'))
    }
    await vh.anlegen('auslagen', { ...neu.value, belege: ids.map(id => ({ directus_files_id: id })) })
    zeige('Eingereicht! Der Vorstand kümmert sich.')
    neu.value = leer()
    belege.value = []
    offenesFormular.value = false
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

function belegeGewaehlt(e: Event) {
  belege.value = [...((e.target as HTMLInputElement).files ?? [])].slice(0, 6)
}

async function stempeln(a: Auslage, status: string) {
  try {
    await vh.aendern('auslagen', a.id, { status })
    zeige(`Gestempelt: ${status}.`)
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <div class="kasse">
    <VereinsheimKopf titel="Kassenbuch" :zusatz="ich?.vorstand ? 'Alle Auslagen im Blick' : 'Deine Auslagen'">
      <BasisKnopf @click="offenesFormular = !offenesFormular">{{ offenesFormular ? 'Doch nicht' : '+ Auslage einreichen' }}</BasisKnopf>
    </VereinsheimKopf>

    <BasisNotizzettel v-if="offenesFormular" farbe="pfirsich" befestigung="klammer" :drehung="-0.5" class="kasse__formular">
      <h2>Auslage einreichen</h2>
      <p>Du hast etwas für den Verein bezahlt? Trag es ein und häng ein Foto vom Kassenbon an – wir überweisen es dir zurück.</p>
      <form @submit.prevent="einreichen">
        <VereinsheimEditor v-model="neu" :felder="FELDER_AUSLAGE" :beziehungen="{ termin: data.termine }" />
        <div class="kasse__belege">
          <label for="belege" class="kasse__belege-label">Belege (Foto oder PDF, bis zu 6)</label>
          <input id="belege" type="file" accept="image/*,application/pdf" multiple @change="belegeGewaehlt">
          <ul v-if="belege.length"><li v-for="b in belege" :key="b.name">📎 {{ b.name }}</li></ul>
        </div>
        <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird abgeheftet …' : 'Einreichen' }}</BasisKnopf>
      </form>
    </BasisNotizzettel>

    <div class="kassenbuch">
      <div class="kassenbuch__kopf">
        <div class="kassenbuch__filter" role="group" aria-label="Welche Auslagen?">
          <button type="button" :aria-pressed="filter === 'offen'" @click="filter = 'offen'">Offen</button>
          <button type="button" :aria-pressed="filter === 'alle'" @click="filter = 'alle'">Alle</button>
        </div>
        <p class="kassenbuch__summe">Offen: <strong>{{ euro(summeOffen) }}</strong></p>
      </div>
      <p v-if="!liste.length" class="handschrift kassenbuch__leer">Keine offenen Auslagen. Die Kasse stimmt!</p>
      <ul class="kassenbuch__zeilen">
        <li v-for="a in liste" :key="a.id" class="eintrag">
          <span class="eintrag__datum">{{ datumLang(a.datum) }}</span>
          <div class="eintrag__text">
            <strong>{{ a.titel }}</strong>
            <span v-if="a.termin" class="eintrag__klein"> · {{ a.termin.titel }}</span>
            <span v-if="ich?.vorstand && a.user_created" class="eintrag__klein handschrift"> – {{ a.user_created.first_name }} {{ a.user_created.last_name }}</span>
            <p v-if="a.notiz" class="eintrag__notiz">{{ a.notiz }}</p>
            <p v-if="ich?.vorstand && a.iban" class="eintrag__klein">an {{ a.kontoinhaber_in }}, {{ a.iban }}</p>
            <p class="eintrag__belege">
              <a v-for="b in a.belege.filter(x => x.directus_files_id)" :key="b.directus_files_id!.id" :href="vh.datei(b.directus_files_id!.id)" target="_blank" rel="noopener" class="eintrag__bon">🧾 {{ b.directus_files_id!.filename_download }}</a>
            </p>
          </div>
          <span class="eintrag__betrag">{{ euro(a.betrag) }}</span>
          <div class="eintrag__status">
            <BasisFeld v-if="ich?.vorstand" :model-value="a.status" label="Stempel" :name="`status-${a.id}`" :optionen="STATUS" @update:model-value="stempeln(a, String($event))" />
            <VereinsheimStempel v-else :status="a.status" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.kasse {
  max-width: 62rem;
  margin-inline: auto;
}

.kasse__formular {
  margin-bottom: var(--abstand-xl);
  padding: 3.2rem var(--abstand-l) var(--abstand-l);
}

.kasse__formular h2 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
}

.kasse__formular form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-m);
}

.kasse__belege {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
}

.kasse__belege-label {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  text-transform: uppercase;
}

.kasse__belege ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* liniertes Kassenbuch mit rotem Rand */
.kassenbuch {
  padding: var(--abstand-m) clamp(0.75rem, 3vw, 2rem) var(--abstand-l) clamp(3rem, 6vw, 4.5rem);
  background:
    linear-gradient(90deg, transparent clamp(2.2rem, 5vw, 3.6rem), rgb(216 52 42 / 0.5) clamp(2.2rem, 5vw, 3.6rem) calc(clamp(2.2rem, 5vw, 3.6rem) + 2px), transparent calc(clamp(2.2rem, 5vw, 3.6rem) + 2px)),
    repeating-linear-gradient(180deg, transparent 0 1.9rem, rgb(0 120 191 / 0.18) 1.9rem 1.95rem),
    #fffef8;
  box-shadow: var(--schatten-karte);
}

.kassenbuch__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  margin-bottom: var(--abstand-m);
}

.kassenbuch__filter button {
  padding: 0.3rem 0.9rem;
  border: 1.5px solid var(--farbe-schwarz);
  background: var(--farbe-weiss);
  font: inherit;
  cursor: pointer;
}

.kassenbuch__filter button:first-child {
  border-radius: var(--radius-m) 0 0 var(--radius-m);
}

.kassenbuch__filter button:last-child {
  border-left: 0;
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
}

.kassenbuch__filter button[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.kassenbuch__summe {
  margin: 0;
  font-size: var(--groesse-l);
}

.kassenbuch__leer {
  font-size: var(--groesse-hand-l);
}

.kassenbuch__zeilen {
  margin: 0;
  padding: 0;
  list-style: none;
}

.eintrag {
  display: grid;
  grid-template-columns: 6.5rem 1fr auto 11rem;
  align-items: start;
  gap: var(--abstand-2xs) var(--abstand-m);
  padding: var(--abstand-s) 0;
  border-bottom: 1.5px solid rgb(0 120 191 / 0.25);
}

.eintrag__datum {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
}

.eintrag__klein {
  font-size: var(--groesse-xs);
}

.eintrag__notiz,
.eintrag__belege {
  margin: 0.2rem 0 0;
  font-size: var(--groesse-xs);
}

.eintrag__bon {
  display: inline-block;
  margin-right: var(--abstand-s);
  padding: 0.1rem 0.5rem;
  border: 1px dashed var(--farbe-schwarz);
  background: var(--farbe-weiss);
  color: var(--farbe-schwarz);
  text-decoration: none;
  rotate: -1deg;
}

.eintrag__betrag {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-m);
  white-space: nowrap;
}

@media (max-width: 760px) {
  .eintrag {
    grid-template-columns: 1fr auto;
  }

  .eintrag__datum,
  .eintrag__status {
    grid-column: 1 / -1;
  }
}
</style>
