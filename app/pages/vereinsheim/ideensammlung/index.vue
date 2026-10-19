<script setup lang="ts">
// Ideensammlung: Vorschläge sortieren, Ideenwand moderieren, Plenum-Erinnerungen verschicken
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Ideensammlung · Vereinsheim', robots: 'noindex, nofollow' })

interface Vorschlag { id: number, status: string, name: string, email: string, idee: string, dorffest: boolean, selbst_mitmachen: boolean, notiz: string | null, date_created: string }
interface Erinnerung { id: number, name: string | null, email: string, wie: string, bestaetigt: boolean, abgemeldet_am: string | null, zuletzt_erinnert_am: string | null, date_created: string }

const reiter = ref('vorschlaege')
const { zeige, fehler } = useVereinsheimMeldung()
const STATUS = { neu: 'neu', in_planung: 'in Planung', umgesetzt: 'umgesetzt', abgelehnt: 'abgelehnt' }

const { data: vorschlaege, refresh: neuLaden } = useAsyncData('vh-vorschlaege', () => vh.liste<Vorschlag>('vorschlaege', { fields: '*', sort: '-date_created' }), { server: false, default: () => [] })
const { data: erinnerungen, refresh: erinnerungenLaden } = useAsyncData('vh-plenum', () => vh.liste<Erinnerung>('plenum_erinnerungen', { fields: 'id,name,email,wie,bestaetigt,abgemeldet_am,zuletzt_erinnert_am,date_created', sort: '-date_created' }), { server: false, default: () => [] })

const neue = computed(() => vorschlaege.value.filter(v => v.status === 'neu').length)
const aktiveErinnerungen = computed(() => erinnerungen.value.filter(e => e.bestaetigt && !e.abgemeldet_am))

const notizen = reactive<Record<number, string>>({})
watch(vorschlaege, liste => liste.forEach((v) => {
  notizen[v.id] ??= v.notiz ?? ''
}), { immediate: true })

async function aendern(v: Vorschlag, daten: Partial<Vorschlag>, text = 'Gespeichert.') {
  try {
    await vh.aendern('vorschlaege', v.id, daten)
    zeige(text)
    await neuLaden()
  }
  catch (e) {
    fehler(e)
  }
}

async function erinnerungLoeschen(e: Erinnerung) {
  if (!window.confirm(`Erinnerung für ${e.email} löschen?`)) return
  try {
    await vh.loeschen('plenum_erinnerungen', e.id)
    zeige('Gelöscht.')
    await erinnerungenLaden()
  }
  catch (err) {
    fehler(err)
  }
}

const zuletztErinnert = computed(() => erinnerungen.value.map(e => e.zuletzt_erinnert_am).filter(Boolean).sort().at(-1) ?? null)
const zusatz = ref('')
const sendet = ref(false)

async function erinnern() {
  if (!window.confirm(`Erinnerung ans nächste Plenum an ${aktiveErinnerungen.value.length} Leute schicken?${zuletztErinnert.value ? ` (Zuletzt verschickt: ${datumLang(zuletztErinnert.value)})` : ''}`)) return
  sendet.value = true
  try {
    const r = await $fetch<{ gesendet: number }>('/api/vereinsheim/plenum/erinnern', { method: 'POST', body: { zusatz: zusatz.value } })
    zeige(`Ab in die Post: ${r.gesendet} Erinnerungen verschickt.`)
    zusatz.value = ''
    await erinnerungenLaden()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

async function adressenKopieren() {
  const liste = aktiveErinnerungen.value.map(e => e.email).join(', ')
  try {
    await navigator.clipboard.writeText(liste)
    zeige(`${aktiveErinnerungen.value.length} Adressen kopiert – bitte ins BCC!`)
  }
  catch {
    window.prompt('Adressen (ins BCC):', liste)
  }
}
</script>

<template>
  <div class="mit">
    <VereinsheimKopf hervorhebung="Ideensammlung" zusatz="Vorschläge von außen, die Ideenwand und die Plenum-Erinnerungen" />
    <VereinsheimReiter
      v-model="reiter"
      :reiter="[
        { key: 'vorschlaege', text: 'Vorschläge', anzahl: neue },
        { key: 'ideenwand', text: 'Ideenwand' },
        { key: 'plenum', text: 'Plenum-Erinnerungen' },
      ]"
    />

    <ul v-if="reiter === 'vorschlaege'" class="mit__vorschlaege">
      <li v-if="!vorschlaege.length" class="mit__leer">Noch keine Vorschläge. Die kommen bestimmt!</li>
      <li v-for="v in vorschlaege" :key="v.id">
        <div class="vh-karte vorschlag">
          <div class="vorschlag__kopf">
            <VereinsheimStempel :status="v.status" />
            <span v-if="v.dorffest" class="vorschlag__marke">Dorffest</span>
            <span v-if="v.selbst_mitmachen" class="vorschlag__marke">macht selbst mit</span>
          </div>
          <p class="vorschlag__idee">{{ v.idee }}</p>
          <p class="vorschlag__wer">– {{ v.name }}, {{ datumLang(v.date_created) }} · <a :href="`mailto:${v.email}?subject=${encodeURIComponent('Deine Idee für Königsdorf')}`">{{ v.email }}</a></p>
          <div class="vorschlag__bearbeiten">
            <BasisFeld :model-value="v.status" label="Stand" :name="`status-${v.id}`" :optionen="STATUS" @update:model-value="aendern(v, { status: String($event) }, 'Umgesteckt!')" />
            <BasisFeld v-model="notizen[v.id]" label="Notiz (intern)" :name="`notiz-${v.id}`" mehrzeilig :zeilen="2" />
            <button type="button" class="vorschlag__speichern" :disabled="(notizen[v.id] ?? '') === (v.notiz ?? '')" @click="aendern(v, { notiz: notizen[v.id] || null })">Notiz ablegen</button>
          </div>
        </div>
      </li>
    </ul>

    <VereinsheimPinnwand v-else-if="reiter === 'ideenwand'" collection="ideen" leer="Die Ideenwand ist noch leer." />

    <div v-else class="mit__plenum">
      <div class="vh-karte plenum-liste">
        <div class="plenum-liste__kopf">
          <p><strong>{{ aktiveErinnerungen.length }}</strong> möchten ans Plenum erinnert werden (bestätigt).</p>
          <BasisKnopf v-if="aktiveErinnerungen.length" groesse="klein" variante="outline" @click="adressenKopieren">Adressen kopieren (BCC)</BasisKnopf>
        </div>
        <form v-if="aktiveErinnerungen.length" class="plenum-liste__senden" @submit.prevent="erinnern">
          <BasisFeld v-model="zusatz" label="Ein paar Worte dazu (optional)" name="zusatz" mehrzeilig :zeilen="3" hinweis="z.B. was auf der Tagesordnung steht. Datum, Ort und Link kommen automatisch dazu." />
          <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird gesendet …' : 'Erinnerung ans nächste Plenum verschicken' }}</BasisKnopf>
          <p v-if="zuletztErinnert" class="plenum-liste__zuletzt">Zuletzt verschickt am {{ datumLang(zuletztErinnert) }}.</p>
        </form>
        <table v-if="erinnerungen.length" class="plenum-liste__tabelle">
          <thead><tr><th>Name</th><th>E-Mail</th><th>Wie oft</th><th>Stand</th><th><span class="nur-screenreader">Aktion</span></th></tr></thead>
          <tbody>
            <tr v-for="e in erinnerungen" :key="e.id">
              <td>{{ e.name }}</td>
              <td>{{ e.email }}</td>
              <td>{{ e.wie === 'jedes' ? 'jedes Plenum' : 'nur das nächste' }}</td>
              <td>{{ e.abgemeldet_am ? `abgemeldet ${datumLang(e.abgemeldet_am)}` : e.bestaetigt ? 'bestätigt' : 'noch nicht bestätigt' }}</td>
              <td><button type="button" class="plenum-liste__weg" @click="erinnerungLoeschen(e)">löschen</button></td>
            </tr>
          </tbody>
        </table>
        <p v-else >Noch niemand eingetragen.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mit {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.mit__leer {
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-m);
}

.mit__vorschlaege {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr));
  gap: var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.vorschlag {
  height: 100%;
}

.vorschlag__kopf {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs);
  margin-bottom: var(--abstand-xs);
}

.vorschlag__marke {
  padding: 0 0.5rem;
  border-radius: 999px;
  background: var(--farbe-tape-flieder);
  font-size: var(--groesse-xs);
}

.vorschlag__idee {
  margin: 0 0 var(--abstand-2xs);
  white-space: pre-line;
}

.vorschlag__wer {
  margin: 0 0 var(--abstand-s);
  font-size: var(--groesse-xs);
}

.vorschlag__bearbeiten {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-xs);
}

.vorschlag__speichern,
.plenum-liste__weg {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  font-size: var(--groesse-xs);
  text-decoration: underline;
  cursor: pointer;
}

.vorschlag__speichern:disabled {
  opacity: 0.4;
  cursor: default;
}

.plenum-liste {
  padding: 2.6rem var(--abstand-l) var(--abstand-l);
}

.plenum-liste__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
}

.plenum-liste__senden {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--abstand-s);
  margin-top: var(--abstand-m);
  padding: var(--abstand-m);
  background: var(--farbe-pfirsich);
  border-radius: var(--radius-m);
}

.plenum-liste__senden :deep(.feld) {
  width: 100%;
}

.plenum-liste__zuletzt {
  margin: 0;
  font-size: var(--groesse-xs);
}

.plenum-liste__tabelle {
  width: 100%;
  margin-top: var(--abstand-m);
  border-collapse: collapse;
  font-size: var(--groesse-xs);
}

.plenum-liste__tabelle th {
  text-align: left;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  text-transform: uppercase;
  border-bottom: 2px solid var(--farbe-schwarz);
}

.plenum-liste__tabelle td,
.plenum-liste__tabelle th {
  padding: 0.4rem;
}

.plenum-liste__tabelle td {
  border-bottom: 1px solid var(--vh-rand);
}

.plenum-liste__weg {
  color: #a1260d;
}

@media (max-width: 700px) {
  .plenum-liste__tabelle {
    display: block;
    overflow-x: auto;
  }
}
</style>
