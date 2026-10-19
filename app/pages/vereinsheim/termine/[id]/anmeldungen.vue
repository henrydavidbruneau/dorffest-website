<script setup lang="ts">
// Anmeldungen zu einem Termin als Strichliste: wer kommt, wer bringt was mit,
// CSV, Druckliste für den Eingang und „Mail an alle Angemeldeten“.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Anmeldungen · Vereinsheim', robots: 'noindex, nofollow' })

interface Anmeldung { id: number, status: string, name: string, email: string, personen: number, nachricht: string | null, mitbringen: string | null, date_created: string }
interface Beitrag { id: number, name: string, was: string, email: string | null, date_created: string }
interface Rundmail { id: number, betreff: string, empfaenger_anzahl: number | null, gesendet_am: string | null, user_created: { first_name: string | null } | null }
interface Termin { id: number, titel: string, beginn: string | null, plaetze: number | null }

const route = useRoute()
const id = Number(route.params.id)
const { zeige, fehler } = useVereinsheimMeldung()

const { data, refresh } = useAsyncData(`vh-anmeldungen-${id}`, async () => {
  const [termin, anmeldungen, beitraege, rundmails] = await Promise.all([
    vh.eins<Termin>('termine', id, { fields: 'id,titel,beginn,plaetze' }),
    vh.liste<Anmeldung>('anmeldungen', { fields: 'id,status,name,email,personen,nachricht,mitbringen,date_created', filter: { termin: { _eq: id } }, sort: 'date_created' }),
    vh.liste<Beitrag>('beitraege', { fields: 'id,name,was,email,date_created', filter: { termin: { _eq: id } }, sort: 'date_created' }),
    vh.liste<Rundmail>('termin_rundmails', { fields: 'id,betreff,empfaenger_anzahl,gesendet_am,user_created.first_name', filter: { termin: { _eq: id } }, sort: '-gesendet_am' }),
  ])
  return { termin, anmeldungen, beitraege, rundmails }
}, { server: false })

const angemeldet = computed(() => data.value?.anmeldungen.filter(a => a.status === 'angemeldet') ?? [])
const personen = computed(() => angemeldet.value.reduce((s, a) => s + (a.personen || 0), 0))
const mitbringen = computed(() => [
  ...angemeldet.value.filter(a => a.mitbringen).map(a => ({ name: a.name, was: a.mitbringen! })),
  ...(data.value?.beitraege ?? []).map(b => ({ name: b.name, was: b.was })),
])

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
  if (!window.confirm(`Anmeldung von ${a.name} wirklich in den Papierkorb?`)) return
  try {
    await vh.loeschen('anmeldungen', a.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

const drucken = () => window.print()

function csv() {
  csvHerunterladen(`anmeldungen-${id}.csv`, ['Name', 'E-Mail', 'Personen', 'Mitbringen', 'Nachricht', 'Status', 'Angemeldet am'],
    (data.value?.anmeldungen ?? []).map(a => [a.name, a.email, a.personen, a.mitbringen, a.nachricht, a.status, datumLang(a.date_created)]))
}

// Rundmail
const mail = reactive({ betreff: '', text: '' })
const sendet = ref(false)
async function rundmail() {
  if (!window.confirm(`Mail an ${angemeldet.value.length} Angemeldete schicken?`)) return
  sendet.value = true
  try {
    const r = await $fetch<{ gesendet: number }>(`/api/vereinsheim/termine/${id}/rundmail`, { method: 'POST', body: { ...mail } })
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
    <NuxtLink :to="`/vereinsheim/termine/${id}`" class="anm__zurueck handschrift">← zum Termin</NuxtLink>
    <VereinsheimKopf :titel="data?.termin.titel ?? 'Anmeldungen'" :zusatz="data?.termin.beginn ? datumAusgeschrieben(data.termin.beginn) : undefined">
      <BasisKnopf variante="outline" groesse="klein" @click="csv">CSV</BasisKnopf>
      <BasisKnopf variante="outline" groesse="klein" @click="drucken">Liste drucken</BasisKnopf>
    </VereinsheimKopf>

    <div class="anm__blatt">
      <p class="anm__summe">
        <span class="anm__striche" aria-hidden="true">
          <span v-for="n in Math.min(Math.floor(personen / 5), 20)" :key="n" class="anm__fuenf">||||</span>{{ '|'.repeat(personen % 5) }}
        </span>
        <strong>{{ personen }} Personen</strong>{{ data?.termin.plaetze ? ` von ${data.termin.plaetze} Plätzen` : '' }}
        · {{ angemeldet.length }} Anmeldungen
      </p>

      <table v-if="data?.anmeldungen.length" class="anm__tabelle">
        <thead>
          <tr><th>Name</th><th>Pers.</th><th>Mitbringen</th><th>Nachricht</th><th class="anm__nicht-drucken">E-Mail</th><th class="anm__nicht-drucken"><span class="nur-screenreader">Aktionen</span></th><th class="anm__nur-drucken">da?</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in data.anmeldungen" :key="a.id" :class="{ 'anm__ab': a.status !== 'angemeldet' }">
            <td>{{ a.name }}</td>
            <td>{{ a.personen }}</td>
            <td>{{ a.mitbringen }}</td>
            <td>{{ a.nachricht }}</td>
            <td class="anm__nicht-drucken"><a :href="`mailto:${a.email}`">{{ a.email }}</a></td>
            <td class="anm__nicht-drucken anm__aktionen">
              <button type="button" @click="umschalten(a)">{{ a.status === 'angemeldet' ? 'abmelden' : 'wieder anmelden' }}</button>
              <button type="button" class="anm__weg" @click="loeschen(a)">löschen</button>
            </td>
            <td class="anm__nur-drucken">☐</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="handschrift anm__leer">Noch niemand angemeldet. Sag’s im Infochannel weiter!</p>

      <section v-if="mitbringen.length" class="anm__mitbringen">
        <h2>Wer bringt was mit?</h2>
        <ul>
          <li v-for="(m, i) in mitbringen" :key="i"><strong>{{ m.name }}:</strong> {{ m.was }}</li>
        </ul>
      </section>
    </div>

    <section class="anm__rundmail anm__nicht-drucken" aria-labelledby="rundmail-titel">
      <BasisNotizzettel farbe="pfirsich" befestigung="pin" :drehung="-0.8" class="anm__rundmail-zettel">
        <h2 id="rundmail-titel">Mail an alle Angemeldeten</h2>
        <p>Jede*r bekommt die Mail einzeln mit persönlicher Anrede („Hallo …“) und unserem Gruß darunter.</p>
        <form class="anm__form" @submit.prevent="rundmail">
          <BasisFeld v-model="mail.betreff" label="Betreff" name="betreff" required :maxlength="200" />
          <BasisFeld v-model="mail.text" label="Text" name="text" required mehrzeilig :zeilen="7" />
          <BasisKnopf type="submit" :disabled="sendet || !angemeldet.length">{{ sendet ? 'Wird eingeworfen …' : `An ${angemeldet.length} schicken` }}</BasisKnopf>
        </form>
        <div v-if="data?.rundmails.length" class="anm__protokoll">
          <h3>Schon verschickt</h3>
          <ul>
            <li v-for="r in data.rundmails" :key="r.id">
              „{{ r.betreff }}“ – {{ r.gesendet_am ? datumLang(r.gesendet_am) : '' }} an {{ r.empfaenger_anzahl }}{{ r.user_created?.first_name ? `, von ${r.user_created.first_name}` : '' }}
            </li>
          </ul>
        </div>
      </BasisNotizzettel>
    </section>
  </div>
</template>

<style scoped>
.anm {
  max-width: 62rem;
  margin-inline: auto;
}

.anm__zurueck {
  display: inline-block;
  margin-bottom: var(--abstand-s);
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  color: var(--farbe-schwarz);
  font-size: var(--groesse-hand-m);
  text-decoration: none;
}

/* kariertes Papier */
.anm__blatt {
  padding: var(--abstand-l) clamp(0.75rem, 3vw, 2rem);
  background:
    repeating-linear-gradient(0deg, rgb(0 0 0 / 0.06) 0 1px, transparent 1px 1.25rem),
    repeating-linear-gradient(90deg, rgb(0 0 0 / 0.06) 0 1px, transparent 1px 1.25rem),
    var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
}

.anm__summe {
  margin: 0 0 var(--abstand-m);
  font-size: var(--groesse-l);
}

.anm__striche {
  margin-right: 0.6rem;
  font-family: var(--schrift-hand);
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
  border-bottom: 1px dashed var(--farbe-spaltenlinie);
}

.anm__ab td {
  color: #777;
  text-decoration: line-through;
}

.anm__aktionen {
  white-space: nowrap;
}

.anm__aktionen button {
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
  font-size: var(--groesse-hand-l);
}

.anm__mitbringen h2,
.anm__rundmail h2 {
  margin: var(--abstand-l) 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.anm__rundmail-zettel {
  margin-top: var(--abstand-xl);
  padding: 2.6rem var(--abstand-l) var(--abstand-l);
}

.anm__rundmail h2 {
  margin-top: 0;
}

.anm__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
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
  .anm__zurueck {
    display: none !important;
  }

  .anm__nur-drucken {
    display: table-cell;
  }

  .anm__blatt {
    box-shadow: none;
    background: none;
  }
}
</style>
