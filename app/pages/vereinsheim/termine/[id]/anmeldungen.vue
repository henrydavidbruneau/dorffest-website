<script setup lang="ts">
// Anmeldungen zu einem Termin als Strichliste: wer kommt, wer bringt was mit,
// CSV, Druckliste für den Eingang und „Mail an alle Angemeldeten“.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Anmeldungen · Vereinsheim', robots: 'noindex, nofollow' })

interface Anmeldung { id: number, status: string, name: string, email: string, personen: number, nachricht: string | null, mitbringen: string | null, date_created: string }
interface Beitrag { id: number, name: string, was: string, email: string | null, date_created: string }
interface Rundmail { id: number, betreff: string, empfaenger_anzahl: number | null, gesendet_am: string | null, user_created: { first_name: string | null } | null }
interface Erinnerung { id: number, name: string | null, email: string, wie: string, zuletzt_erinnert_am: string | null }
interface Termin { id: number, slug: string, titel: string, beginn: string | null, ende: string | null, plaetze: number | null, mitbringen_frage?: string | null, wiederholung?: string | null, wiederholung_bis?: string | null }

const route = useRoute()
const id = Number(route.params.id)
const { zeige, fehler } = useVereinsheimMeldung()

const { data, refresh } = useAsyncData(`vh-anmeldungen-${id}`, async () => {
  const [termin, anmeldungen, beitraege, rundmails] = await Promise.all([
    // `*`: auch `mitbringen_frage` (eigene Frage, z.B. Liederwünsche), ohne dass ein fehlendes Feld stört
    vh.eins<Termin>('termine', id, { fields: '*' }),
    vh.liste<Anmeldung>('anmeldungen', { fields: 'id,status,name,email,personen,nachricht,mitbringen,date_created', filter: { termin: { _eq: id } }, sort: 'date_created' }),
    vh.liste<Beitrag>('beitraege', { fields: 'id,name,was,email,date_created', filter: { termin: { _eq: id } }, sort: 'date_created' }),
    vh.liste<Rundmail>('termin_rundmails', { fields: 'id,betreff,empfaenger_anzahl,gesendet_am,user_created.first_name', filter: { termin: { _eq: id } }, sort: '-gesendet_am' }),
  ])
  // Plenum: wer erinnert werden will, steht bei jedem Treffen mit auf der Liste
  const erinnerungen = istPlenum(termin.slug)
    ? await vh.liste<Erinnerung>('plenum_erinnerungen', { fields: 'id,name,email,wie,zuletzt_erinnert_am', filter: { bestaetigt: { _eq: true }, abgemeldet_am: { _null: true } }, sort: 'name' })
    : []
  return { termin, anmeldungen, beitraege, rundmails, erinnerungen }
}, { server: false })

// Regelmäßige Termine: Anmeldungen je Runde (wie auf der Website: seit dem letzten Treffen
// zählen sie fürs nächste). Standard ist die nächste Runde, ältere lassen sich auswählen.
const regelmaessig = computed(() => !!data.value?.termin.wiederholung && data.value.termin.wiederholung !== 'aus')
const rundeVon = (zeit: string) => (data.value ? vorkommenFuer(data.value.termin, Date.parse(zeit))?.beginn ?? '' : '')
const naechsteRunde = computed(() => (data.value ? naechstesVorkommen(data.value.termin)?.beginn ?? '' : ''))
const runde = ref('')
const gewaehlt = computed(() => runde.value || naechsteRunde.value)
const runden = computed(() => {
  if (!regelmaessig.value || !data.value) return []
  const alle = new Set([naechsteRunde.value, ...[...data.value.anmeldungen, ...data.value.beitraege].map(a => rundeVon(a.date_created))])
  return [...alle].filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))
})
const inRunde = (zeit: string) => !regelmaessig.value || rundeVon(zeit) === gewaehlt.value

const anmeldungen = computed(() => data.value?.anmeldungen.filter(a => inRunde(a.date_created)) ?? [])
const angemeldet = computed(() => anmeldungen.value.filter(a => a.status === 'angemeldet'))
const personen = computed(() => angemeldet.value.reduce((s, a) => s + (a.personen || 0), 0))
const mitbringen = computed(() => [
  ...angemeldet.value.filter(a => a.mitbringen).map(a => ({ name: a.name, was: a.mitbringen! })),
  ...(data.value?.beitraege ?? []).filter(b => inRunde(b.date_created)).map(b => ({ name: b.name, was: b.was })),
])
// „Nachricht an uns“ gibt es im Formular nicht mehr – Spalte nur für alte Anmeldungen mit Nachricht
const mitNachricht = computed(() => anmeldungen.value.some(a => a.nachricht))
// Erinnerungs-Abos gehören immer zum nächsten Treffen
const erinnerungen = computed(() => (gewaehlt.value === naechsteRunde.value ? data.value?.erinnerungen ?? [] : []))
const angemeldeteMails = computed(() => new Set(angemeldet.value.map(a => a.email.toLowerCase())))
const nurErinnerung = computed(() => erinnerungen.value.filter(e => !angemeldeteMails.value.has(e.email.toLowerCase())))
const empfaengerAnzahl = computed(() => angemeldet.value.length + nurErinnerung.value.length)

async function erinnerungLoeschen(e: Erinnerung) {
  if (!window.confirm(`${e.name || e.email} nicht mehr ans Plenum erinnern?`)) return
  try {
    await vh.aendern('plenum_erinnerungen', e.id, { abgemeldet_am: new Date().toISOString() })
    zeige('Abgemeldet – keine Erinnerungen mehr.')
    await refresh()
  }
  catch (err) {
    fehler(err)
  }
}

// Vorschau der Rundmail, so wie sie bei der ersten Person ankommt
const vorschauAn = computed(() => angemeldet.value[0] ?? nurErinnerung.value[0] ?? null)
const vorschauText = computed(() => [`Hallo ${vorschauAn.value?.name || 'du'},`, mail.text.trim() || '…', GRUSS].join('\n\n'))

const kopfDatum = computed(() => (regelmaessig.value ? gewaehlt.value : data.value?.termin.beginn) || null)

async function umschalten(a: Anmeldung) {
  try {
    await vh.aendern('anmeldungen', a.id, { status: a.status === 'angemeldet' ? 'abgemeldet' : 'angemeldet' })
    zeige(a.status === 'angemeldet' ? `${a.name} ist abgemeldet – der Platz ist wieder frei.` : `${a.name} ist wieder dabei.`)
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(a: Anmeldung) {
  if (!window.confirm(`Anmeldung von ${a.name} wirklich löschen?`)) return
  try {
    await vh.loeschen('anmeldungen', a.id)
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

const drucken = () => window.print()

function csv() {
  csvHerunterladen(`anmeldungen-${id}.csv`, ['Name', 'E-Mail', 'Personen', data.value?.termin.mitbringen_frage || 'Mitbringen', 'Nachricht', 'Status', 'Angemeldet am'],
    anmeldungen.value.map(a => [a.name, a.email, a.personen, a.mitbringen, a.nachricht, a.status, datumLang(a.date_created)]))
}

// Rundmail
const mail = reactive({ betreff: '', text: '' })
const sendet = ref(false)
async function rundmail() {
  if (!window.confirm(`Mail an ${empfaengerAnzahl.value} Leute schicken?`)) return
  sendet.value = true
  try {
    const r = await $fetch<{ gesendet: number }>(`/api/vereinsheim/termine/${id}/rundmail`, { method: 'POST', body: { ...mail, ids: angemeldet.value.map(a => a.id), mitErinnerung: erinnerungen.value.length > 0 } })
    zeige(`Ab in die Post: ${r.gesendet} Mails verschickt.`)
    mail.betreff = ''
    mail.text = ''
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

watch(() => data.value?.termin, (t) => {
  if (t && !mail.betreff) mail.betreff = `Neues zu: ${t.titel}`
})
</script>

<template>
  <div class="anm">
    <VereinsheimKopf :titel="data?.termin.titel ?? 'Anmeldungen'" :zusatz="`Anmeldungen${kopfDatum ? ` · ${datumAusgeschrieben(kopfDatum)}` : ''}`" :zurueck="{ to: `/vereinsheim/termine/${id}`, text: 'Zum Termin' }">
      <BasisKnopf variante="outline" groesse="klein" @click="csv">CSV</BasisKnopf>
      <BasisKnopf variante="outline" groesse="klein" @click="drucken">Liste drucken</BasisKnopf>
    </VereinsheimKopf>

    <div class="anm__blatt">
      <label v-if="runden.length > 1" class="anm__runde">
        Treffen
        <select v-model="runde">
          <option value="">{{ datumAusgeschrieben(naechsteRunde) }} (nächstes)</option>
          <option v-for="r in runden.filter(r => r !== naechsteRunde)" :key="r" :value="r">{{ datumAusgeschrieben(r) }}</option>
        </select>
      </label>
      <p v-else-if="regelmaessig" class="anm__runde">Regelmäßiger Termin: hier stehen die Anmeldungen fürs nächste Treffen.</p>
      <p class="anm__summe">
        <span class="anm__striche" aria-hidden="true">
          <span v-for="n in Math.min(Math.floor(personen / 5), 20)" :key="n" class="anm__fuenf">||||</span>{{ '|'.repeat(personen % 5) }}
        </span>
        <strong>{{ personen }} Personen</strong>{{ data?.termin.plaetze ? ` von ${data.termin.plaetze} Plätzen` : '' }}
        · {{ angemeldet.length }} Anmeldungen
      </p>

      <div v-if="anmeldungen.length" class="anm__scroll">
      <table class="anm__tabelle">
        <thead>
          <tr><th>Name</th><th>Pers.</th><th>{{ data?.termin.mitbringen_frage ? 'Antwort' : 'Mitbringen' }}</th><th v-if="mitNachricht">Nachricht</th><th class="anm__nicht-drucken">E-Mail</th><th class="anm__nicht-drucken"><span class="nur-screenreader">Aktionen</span></th><th class="anm__nur-drucken">da?</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in anmeldungen" :key="a.id" :class="{ 'anm__ab': a.status !== 'angemeldet' }">
            <td>{{ a.name }}</td>
            <td>{{ a.personen }}</td>
            <td>{{ a.mitbringen }}</td>
            <td v-if="mitNachricht">{{ a.nachricht }}</td>
            <td class="anm__nicht-drucken"><a :href="`mailto:${a.email}`">{{ a.email }}</a></td>
            <td class="anm__nicht-drucken anm__aktionen">
              <button type="button" @click="umschalten(a)">{{ a.status === 'angemeldet' ? 'abmelden' : 'wieder anmelden' }}</button>
              <button type="button" class="anm__weg" @click="loeschen(a)">löschen</button>
            </td>
            <td class="anm__nur-drucken">☐</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p v-else class="anm__leer">Noch niemand angemeldet. Sag’s im Infochannel weiter!</p>

      <section v-if="erinnerungen.length" class="anm__erinnerung" aria-labelledby="erinnerung-titel">
        <h2 id="erinnerung-titel">Wollen erinnert werden <span>· {{ erinnerungen.length }}</span></h2>
        <p class="anm__erinnerung-info">
          Eingetragen über „Mitmachen“. Die Erinnerung geht automatisch {{ ERINNERUNG_TAGE_VORHER }} Tage vorher raus; „Mail an alle“ unten erreicht sie auch.
        </p>
        <ul>
          <li v-for="e in erinnerungen" :key="e.id">
            <span><strong>{{ e.name || '–' }}</strong> · {{ e.email }} · {{ e.wie === 'jedes' ? 'jedes Plenum' : 'nur das nächste' }}<template v-if="e.zuletzt_erinnert_am"> · zuletzt erinnert {{ datumLang(e.zuletzt_erinnert_am) }}</template></span>
            <button type="button" class="anm__weg anm__nicht-drucken" @click="erinnerungLoeschen(e)">nicht mehr erinnern</button>
          </li>
        </ul>
      </section>

      <section v-if="mitbringen.length" class="anm__mitbringen">
        <h2>{{ data?.termin.mitbringen_frage || 'Wer bringt was mit?' }}</h2>
        <ul>
          <li v-for="(m, i) in mitbringen" :key="i"><strong>{{ m.name }}:</strong> {{ m.was }}</li>
        </ul>
      </section>
    </div>

    <section class="anm__rundmail anm__nicht-drucken" aria-labelledby="rundmail-titel">
      <div class="vh-karte anm__rundmail-zettel">
        <h2 id="rundmail-titel">Mail an alle Angemeldeten</h2>
        <p>Jede*r bekommt die Mail einzeln mit persönlicher Anrede („Hallo …“) und unserem Gruß darunter.<template v-if="nurErinnerung.length"> Auch an die {{ nurErinnerung.length }}, die ans Plenum erinnert werden wollen (mit Abmelde-Link).</template></p>
        <form class="anm__form" @submit.prevent="rundmail">
          <BasisFeld v-model="mail.betreff" label="Betreff" name="betreff" required :maxlength="200" />
          <BasisFeld v-model="mail.text" label="Text" name="text" required mehrzeilig :zeilen="7" />
          <div v-if="vorschauAn" class="anm__vorschau" aria-live="polite">
            <p class="anm__vorschau-titel">Vorschau</p>
            <dl class="anm__vorschau-kopf">
              <dt>An</dt><dd>{{ vorschauAn.name || vorschauAn.email }}{{ empfaengerAnzahl > 1 ? ` (und ${empfaengerAnzahl - 1} weitere, jede*r einzeln)` : '' }}</dd>
              <dt>Betreff</dt><dd>{{ mail.betreff || '…' }}</dd>
            </dl>
            <p class="anm__vorschau-text">{{ vorschauText }}</p>
            <p v-if="nurErinnerung.length" class="anm__vorschau-hinweis">Wer nur ans Plenum erinnert werden will, bekommt vor dem Gruß noch einen Abmelde-Link.</p>
          </div>
          <BasisKnopf type="submit" :disabled="sendet || !empfaengerAnzahl">{{ sendet ? 'Wird gesendet …' : `An ${empfaengerAnzahl} schicken` }}</BasisKnopf>
        </form>
        <div v-if="data?.rundmails.length" class="anm__protokoll">
          <h3>Schon verschickt</h3>
          <ul>
            <li v-for="r in data.rundmails" :key="r.id">
              „{{ r.betreff }}“ – {{ r.gesendet_am ? datumLang(r.gesendet_am) : '' }} an {{ r.empfaenger_anzahl }}{{ r.user_created?.first_name ? `, von ${r.user_created.first_name}` : '' }}
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.anm {
  max-width: 62rem;
  margin-inline: auto;
}

.anm__scroll {
  overflow-x: auto;
}

.anm__blatt {
  padding: var(--abstand-l) clamp(0.75rem, 3vw, 2rem);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-weiss);
  box-shadow: var(--vh-schatten);
}

.anm__runde {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 var(--abstand-m);
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.anm__runde select {
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--vh-rand);
  border-radius: 0.4rem;
  background: var(--farbe-weiss);
  font: inherit;
  font-size: var(--groesse-s);
  color: var(--farbe-schwarz);
}

@media print {
  .anm__runde select {
    border: 0;
    appearance: none;
  }
}

.anm__summe {
  margin: 0 0 var(--abstand-m);
  font-size: var(--groesse-l);
}

.anm__striche {
  margin-right: 0.6rem;
  font-size: 2rem;
  letter-spacing: 0.1em;
  color: var(--farbe-lila);
}

.anm__fuenf {
  position: relative;
  margin-right: 0.4rem;
}

.anm__fuenf::after {
  content: '';
  position: absolute;
  left: -0.15rem;
  right: -0.15rem;
  top: 50%;
  border-top: 2px solid currentColor;
  rotate: -25deg;
}

.anm__tabelle {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--groesse-s);
}

.anm__tabelle th {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  text-align: left;
  text-transform: uppercase;
  border-bottom: 2px solid var(--farbe-schwarz);
}

.anm__tabelle th,
.anm__tabelle td {
  padding: 0.45rem 0.5rem;
  vertical-align: top;
}

.anm__tabelle td {
  border-bottom: 1px solid var(--vh-rand);
}

.anm__ab td {
  color: #777;
  text-decoration: line-through;
}

.anm__aktionen {
  white-space: nowrap;
}

.anm__aktionen button,
.anm__erinnerung button {
  margin-right: 0.6rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  font-size: var(--groesse-xs);
  text-decoration: underline;
  cursor: pointer;
}

.anm__aktionen .anm__weg {
  color: #a1260d;
}

.anm__leer {
  font-size: var(--groesse-m);
}

.anm__mitbringen h2,
.anm__rundmail h2 {
  margin: var(--abstand-l) 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.anm__rundmail-zettel {
  margin-top: var(--abstand-xl);
}

.anm__rundmail h2 {
  margin-top: 0;
}

.anm__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.anm__erinnerung h2 {
  margin: var(--abstand-l) 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.anm__erinnerung h2 span {
  color: var(--vh-gedaempft);
}

.anm__erinnerung-info {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.anm__erinnerung ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.anm__erinnerung li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem var(--abstand-s);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vh-rand);
  font-size: var(--groesse-s);
}

.anm__erinnerung .anm__weg {
  color: #a1260d;
}

/* Rundmail-Vorschau: sieht aus wie eine schlichte Mail */
.anm__vorschau {
  padding: var(--abstand-s) var(--abstand-m);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-creme);
}

.anm__vorschau-titel {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vh-gedaempft);
}

.anm__vorschau-kopf {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem var(--abstand-s);
  margin: 0;
  padding-bottom: var(--abstand-xs);
  border-bottom: 1px solid var(--vh-rand);
  font-size: var(--groesse-xs);
}

.anm__vorschau-kopf dt {
  color: var(--vh-gedaempft);
}

.anm__vorschau-kopf dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.anm__vorschau-text {
  margin: var(--abstand-xs) 0 0;
  font-size: var(--groesse-s);
  white-space: pre-line;
}

.anm__vorschau-hinweis {
  margin: var(--abstand-xs) 0 0;
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.anm__protokoll h3 {
  margin: var(--abstand-l) 0 var(--abstand-2xs);
  font-size: var(--groesse-m);
}

.anm__nur-drucken {
  display: none;
}

@media (max-width: 700px) {
  .anm__tabelle {
    display: block;
    overflow-x: auto;
  }
}

@media print {
  .anm__nicht-drucken,
    .anm__nur-drucken {
    display: table-cell;
  }

  .anm__blatt {
    box-shadow: none;
    background: none;
  }
}
</style>
