<script setup lang="ts">
// Mitglieder (nur Vorstand): Anträge entscheiden, Mitgliederliste mit Beiträgen
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Mitglieder · Vereinsheim', robots: 'noindex, nofollow' })

interface Antrag {
  id: number, status: string, art: string, beitrag_stufe: string, beitrag_jahr: string | number
  vorname: string, nachname: string, strasse: string, plz: string, ort: string, email: string, telefon: string | null
  plenum_besucht: boolean | null, nachricht: string | null, date_created: string, entschieden_am: string | null
  entschieden_von: { first_name: string | null } | null
}
interface Mitglied { id: number, status: string, art: string, vorname: string, nachname: string, email: string | null, telefon: string | null, strasse: string | null, plz: string | null, ort: string | null, mitglied_seit: string | null, beitrag_jahr: string | number | null, beitrag_bezahlt_bis: string | null }

const reiter = ref('antraege')
const { zeige, fehler } = useVereinsheimMeldung()
const arbeitet = ref(false)

const { data, refresh } = useAsyncData('vh-mitglieder', async () => {
  const [antraege, mitglieder] = await Promise.all([
    vh.liste<Antrag>('mitgliedsantraege', { fields: '*,entschieden_von.first_name', sort: '-date_created' }),
    vh.liste<Mitglied>('mitglieder', { fields: 'id,status,art,vorname,nachname,email,telefon,strasse,plz,ort,mitglied_seit,beitrag_jahr,beitrag_bezahlt_bis', sort: 'nachname,vorname' }),
  ])
  return { antraege, mitglieder }
}, { server: false, default: () => ({ antraege: [], mitglieder: [] }) })

const offen = computed(() => data.value.antraege.filter(a => a.status === 'eingereicht'))
const entschieden = computed(() => data.value.antraege.filter(a => a.status !== 'eingereicht'))
const aktive = computed(() => data.value.mitglieder.filter(m => m.status === 'aktiv'))
const heute = new Date().toISOString().slice(0, 10)
const imRueckstand = (m: Mitglied) => m.status === 'aktiv' && (!m.beitrag_bezahlt_bis || m.beitrag_bezahlt_bis < heute)

async function entscheiden(a: Antrag, aktion: 'annehmen' | 'ablehnen') {
  const frage = aktion === 'annehmen'
    ? `${a.vorname} ${a.nachname} aufnehmen? Es geht eine Willkommens-Mail raus.`
    : `Antrag von ${a.vorname} ${a.nachname} ablehnen? (Es geht keine automatische Mail raus.)`
  if (!window.confirm(frage)) return
  arbeitet.value = true
  try {
    await $fetch(`/api/vereinsheim/mitgliedsantraege/${a.id}/${aktion}`, { method: 'POST' })
    zeige(aktion === 'annehmen' ? `Willkommen im Verein, ${a.vorname}!` : 'Abgelehnt.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  arbeitet.value = false
}

function csv() {
  csvHerunterladen('mitglieder.csv', ['Nachname', 'Vorname', 'Art', 'Status', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Ort', 'Mitglied seit', 'Beitrag/Jahr', 'Bezahlt bis'],
    data.value.mitglieder.map(m => [m.nachname, m.vorname, m.art, m.status, m.email, m.telefon, m.strasse, m.plz, m.ort, m.mitglied_seit, m.beitrag_jahr, m.beitrag_bezahlt_bis]))
}

const ART: Record<string, string> = { foerder: 'Fördermitglied', regulaer: 'regulär', stimmberechtigt: 'stimmberechtigt' }
</script>

<template>
  <div class="mitglieder">
    <VereinsheimKopf titel="Mitglieder" zusatz="Nur für den Vorstand">
      <template v-if="reiter === 'liste'">
        <BasisKnopf variante="outline" groesse="klein" @click="csv">CSV</BasisKnopf>
        <BasisKnopf groesse="klein" to="/vereinsheim/mitglieder/neu">+ Mitglied</BasisKnopf>
      </template>
    </VereinsheimKopf>
    <VereinsheimReiter v-model="reiter" :reiter="[{ key: 'antraege', text: 'Anträge', anzahl: offen.length }, { key: 'liste', text: `Mitgliederliste (${aktive.length})` }]" />

    <div v-if="reiter === 'antraege'">
      <p v-if="!offen.length" class="handschrift mitglieder__leer">Keine offenen Anträge. Der Vorstand darf Kuchen essen.</p>
      <ul class="antraege">
        <li v-for="a in offen" :key="a.id">
          <BasisNotizzettel farbe="weiss" befestigung="klammer" :drehung="-0.6" class="antrag">
            <p class="antrag__art handschrift">{{ ART[a.art] }} · {{ euro(a.beitrag_jahr) }} im Jahr</p>
            <h2>{{ a.vorname }} {{ a.nachname }}</h2>
            <p>{{ a.strasse }}, {{ a.plz }} {{ a.ort }}<br><a :href="`mailto:${a.email}`">{{ a.email }}</a>{{ a.telefon ? ` · ${a.telefon}` : '' }}</p>
            <p v-if="a.art === 'regulaer'" class="antrag__plenum">{{ a.plenum_besucht ? '✓ war laut eigener Angabe schon beim Plenum' : '⚠ noch nicht beim Plenum gewesen' }}</p>
            <p v-if="a.nachricht" class="antrag__nachricht">„{{ a.nachricht }}“</p>
            <p class="antrag__klein">eingegangen am {{ datumLang(a.date_created) }}</p>
            <div class="antrag__knoepfe">
              <BasisKnopf :disabled="arbeitet" @click="entscheiden(a, 'annehmen')">Aufnehmen</BasisKnopf>
              <BasisKnopf variante="outline" :disabled="arbeitet" @click="entscheiden(a, 'ablehnen')">Ablehnen</BasisKnopf>
            </div>
          </BasisNotizzettel>
        </li>
      </ul>
      <details v-if="entschieden.length" class="mitglieder__erledigt">
        <summary>Schon entschieden ({{ entschieden.length }})</summary>
        <ul>
          <li v-for="a in entschieden" :key="a.id">
            {{ a.vorname }} {{ a.nachname }} <VereinsheimStempel :status="a.status" />
            {{ a.entschieden_am ? datumLang(a.entschieden_am) : '' }}{{ a.entschieden_von?.first_name ? ` von ${a.entschieden_von.first_name}` : '' }}
          </li>
        </ul>
      </details>
    </div>

    <div v-else class="liste">
      <table class="liste__tabelle">
        <thead>
          <tr><th>Name</th><th>Art</th><th>seit</th><th>Beitrag</th><th>bezahlt bis</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in data.mitglieder" :key="m.id">
            <td><NuxtLink :to="`/vereinsheim/mitglieder/${m.id}`">{{ m.nachname }}, {{ m.vorname }}</NuxtLink></td>
            <td>{{ ART[m.art] }}</td>
            <td>{{ m.mitglied_seit ? datumLang(m.mitglied_seit) : '' }}</td>
            <td>{{ m.beitrag_jahr ? euro(m.beitrag_jahr) : '' }}</td>
            <td :class="{ 'liste__rueckstand': imRueckstand(m) }">{{ m.beitrag_bezahlt_bis ? datumLang(m.beitrag_bezahlt_bis) : 'offen' }}</td>
            <td><VereinsheimStempel :status="m.status" /></td>
          </tr>
        </tbody>
      </table>
      <p v-if="!data.mitglieder.length" class="handschrift">Noch keine Mitglieder eingetragen.</p>
    </div>
  </div>
</template>

<style scoped>
.mitglieder {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.mitglieder__leer {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-l);
}

.antraege {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr));
  gap: var(--abstand-xl) var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.antrag {
  height: 100%;
  padding: 3.2rem var(--abstand-m) var(--abstand-m);
}

.antrag h2 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.antrag p {
  margin: 0 0 var(--abstand-2xs);
}

.antrag__art {
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.antrag__nachricht {
  font-style: italic;
}

.antrag__klein {
  font-size: var(--groesse-xs);
}

.antrag__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-s);
  margin-top: var(--abstand-s);
}

.mitglieder__erledigt {
  margin-top: var(--abstand-xl);
  padding: var(--abstand-s) var(--abstand-m);
  background: rgb(255 253 247 / 0.9);
}

.mitglieder__erledigt summary {
  cursor: pointer;
  text-decoration: underline;
}

.liste {
  padding: var(--abstand-m);
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
  overflow-x: auto;
}

.liste__tabelle {
  width: 100%;
  border-collapse: collapse;
}

.liste__tabelle th {
  text-align: left;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  text-transform: uppercase;
  border-bottom: 2px solid var(--farbe-schwarz);
}

.liste__tabelle th,
.liste__tabelle td {
  padding: 0.45rem 0.5rem;
}

.liste__tabelle td {
  border-bottom: 1px dashed var(--farbe-spaltenlinie);
}

.liste__rueckstand {
  color: #a1260d;
  font-weight: var(--gewicht-text-normal);
}
</style>
