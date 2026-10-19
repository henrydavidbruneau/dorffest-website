<script setup lang="ts">
// Termine: kommend / vergangen / Entwürfe, nach Monat gruppiert, mit Ort und Anmeldestand
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Termine · Vereinsheim', robots: 'noindex, nofollow' })

interface TerminZeile { id: number, status: string, titel: string, slug: string, beginn: string | null, ende: string | null, datum_text: string | null, uhrzeit_folgt: boolean | null, ort: string | null, plaetze: number | null, anmeldung_aktiv: boolean }

const { zeige, fehler } = useVereinsheimMeldung()
const ansicht = ref<'kommend' | 'vergangen' | 'entwuerfe'>('kommend')

const { data, refresh, status } = useAsyncData('vh-termine', async () => {
  const [termine, summen] = await Promise.all([
    vh.liste<TerminZeile>('termine', { fields: 'id,status,titel,slug,beginn,ende,datum_text,uhrzeit_folgt,ort,plaetze,anmeldung_aktiv', sort: 'beginn' }),
    vh.liste<{ termin: number, sum: { personen: string | number | null } }>('anmeldungen', {
      'aggregate[sum]': 'personen', 'groupBy[]': 'termin', 'filter': { status: { _eq: 'angemeldet' } },
    }).catch(() => []),
  ])
  const angemeldet = Object.fromEntries(summen.map(s => [s.termin, Number(s.sum.personen ?? 0)]))
  return termine.map(t => ({ ...t, angemeldet: angemeldet[t.id] ?? 0 }))
}, { server: false, default: () => [] })

const istVorbei = (t: TerminZeile) => !!t.beginn && Date.parse(t.ende ?? t.beginn) + (t.ende ? 0 : 86_400_000) < Date.now()
const liste = computed(() => {
  const alle = data.value
  if (ansicht.value === 'entwuerfe') return alle.filter(t => t.status !== 'published')
  const veroeffentlicht = alle.filter(t => t.status === 'published')
  return ansicht.value === 'kommend' ? veroeffentlicht.filter(t => !istVorbei(t)) : veroeffentlicht.filter(istVorbei).reverse()
})
const anzahl = computed(() => ({
  kommend: data.value.filter(t => t.status === 'published' && !istVorbei(t)).length,
  vergangen: data.value.filter(t => t.status === 'published' && istVorbei(t)).length,
  entwuerfe: data.value.filter(t => t.status !== 'published').length,
}))

async function duplizieren(t: TerminZeile) {
  try {
    const voll = await vh.eins<Record<string, unknown>>('termine', t.id, { fields: FELDER_TERMIN.map(f => f.feld).join(',') })
    const kopie = await vh.anlegen<{ id: number }>('termine', { ...voll, slug: `${t.slug}-kopie-${Date.now().toString(36).slice(-4)}`, titel: `${t.titel} (Kopie)`, status: 'draft' })
    zeige('Kopie angelegt (als Entwurf).')
    await navigateTo(`/vereinsheim/termine/${kopie.id}`)
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(t: TerminZeile & { angemeldet: number }) {
  const zusatz = t.angemeldet ? ` Die ${t.angemeldet} Anmeldungen werden mitgelöscht.` : ''
  if (!window.confirm(`„${t.titel}“ wirklich löschen?${zusatz}`)) return
  try {
    await vh.loeschen('termine', t.id)
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

// nach Monat gruppieren; Termine ohne Datum kommen in „Datum folgt“
const gruppen = computed(() => {
  const ergebnis: { titel: string, termine: typeof liste.value }[] = []
  for (const t of liste.value) {
    const titel = t.beginn ? monatJahr(t.beginn) : 'Datum folgt'
    const letzte = ergebnis.at(-1)
    if (letzte?.titel === titel) letzte.termine.push(t)
    else ergebnis.push({ titel, termine: [t] })
  }
  return ergebnis
})

const zeit = (t: TerminZeile) => (!t.beginn ? (t.datum_text ?? 'Datum folgt') : t.uhrzeit_folgt ? 'Uhrzeit folgt' : `${uhrzeit(t.beginn)} Uhr`)
const fuellung = (t: TerminZeile & { angemeldet: number }) => (t.plaetze ? Math.min(100, Math.round(t.angemeldet / t.plaetze * 100)) : 0)

// Weitere Aktionen in einem kleinen Menü je Termin
const menue = ref<number | null>(null)
function schliessen(e: Event) {
  if (!(e.target as HTMLElement).closest('.termin__mehr')) menue.value = null
}
onMounted(() => document.addEventListener('click', schliessen))
onBeforeUnmount(() => document.removeEventListener('click', schliessen))
</script>

<template>
  <div class="termine">
    <VereinsheimKopf titel="Unsere" hervorhebung="Termine">
      <BasisKnopf to="/vereinsheim/termine/neu" groesse="klein">+ Neuer Termin</BasisKnopf>
    </VereinsheimKopf>

    <VereinsheimReiter
      v-model="ansicht"
      :reiter="[
        { key: 'kommend', text: `Kommend · ${anzahl.kommend}` },
        { key: 'vergangen', text: `Vergangen · ${anzahl.vergangen}` },
        { key: 'entwuerfe', text: `Entwürfe · ${anzahl.entwuerfe}` },
      ]"
    />

    <p v-if="status === 'pending'" class="vh-leer">Termine werden geladen …</p>
    <p v-else-if="!liste.length" class="vh-leer vh-karte">
      {{ ansicht === 'entwuerfe' ? 'Keine Entwürfe.' : ansicht === 'kommend' ? 'Gerade ist nichts geplant. Zeit für ein Fest?' : 'Noch nichts vorbei.' }}
    </p>

    <section v-for="g in gruppen" v-else :key="g.titel" class="monat">
      <h2 class="monat__titel">{{ g.titel }}</h2>
      <ul class="monat__liste">
        <li v-for="t in g.termine" :key="t.id" class="termin vh-karte">
          <NuxtLink :to="`/vereinsheim/termine/${t.id}`" class="termin__datum" :aria-label="`${t.titel} bearbeiten`">
            <template v-if="t.beginn">
              <span class="termin__wochentag">{{ wochentagKurz(t.beginn) }}</span>
              <span class="termin__tag">{{ tagZahl(t.beginn) }}</span>
              <span class="termin__monat">{{ monatKurz(t.beginn) }}</span>
            </template>
            <span v-else class="termin__tag termin__tag--offen">?</span>
          </NuxtLink>

          <div class="termin__text">
            <h3 class="termin__titel">
              <NuxtLink :to="`/vereinsheim/termine/${t.id}`">{{ t.titel }}</NuxtLink>
            </h3>
            <p class="termin__meta">
              <span>{{ zeit(t) }}</span>
              <span>{{ t.ort || 'Ort folgt' }}</span>
              <VereinsheimStempel v-if="t.status !== 'published'" :status="t.status" />
            </p>
          </div>

          <NuxtLink v-if="t.anmeldung_aktiv" :to="`/vereinsheim/termine/${t.id}/anmeldungen`" class="termin__anmeldungen">
            <span><strong>{{ t.angemeldet }}</strong>{{ t.plaetze ? ` von ${t.plaetze}` : '' }} angemeldet</span>
            <span v-if="t.plaetze" class="termin__balken" :class="{ 'termin__balken--voll': t.angemeldet >= t.plaetze }">
              <span :style="{ width: `${fuellung(t)}%` }" />
            </span>
          </NuxtLink>
          <span v-else class="termin__anmeldungen termin__anmeldungen--aus">ohne Anmeldung</span>

          <div class="termin__aktionen">
            <BasisKnopf :to="`/vereinsheim/termine/${t.id}`" groesse="klein" variante="outline">Bearbeiten</BasisKnopf>
            <div class="termin__mehr">
              <button type="button" class="termin__mehr-knopf" :aria-expanded="menue === t.id" :aria-label="`Mehr zu ${t.titel}`" @click="menue = menue === t.id ? null : t.id">⋯</button>
              <ul v-if="menue === t.id" class="termin__menue">
                <li><NuxtLink :to="`/vereinsheim/termine/${t.id}/anmeldungen`">Anmeldungen &amp; Rundmail</NuxtLink></li>
                <li v-if="t.status === 'published'"><a :href="`/termine/${t.slug}`" target="_blank" rel="noopener">Auf der Website ansehen ↗</a></li>
                <li><button type="button" @click="duplizieren(t)">Duplizieren</button></li>
                <li><button type="button" class="termin__weg" @click="loeschen(t)">Löschen</button></li>
              </ul>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.termine {
  max-width: 62rem;
}

.monat + .monat {
  margin-top: var(--abstand-l);
}

.monat__titel {
  margin: 0 0 var(--abstand-xs);
  color: var(--vh-gedaempft);
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: var(--groesse-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.monat__liste {
  display: grid;
  gap: var(--abstand-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.termin {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) 11rem auto;
  align-items: center;
  gap: var(--abstand-xs) var(--abstand-m);
  padding: var(--abstand-s) var(--abstand-m);
}

/* Kalenderblatt */
.termin__datum {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.35rem 0 0.45rem;
  border-radius: 0.6rem;
  background: var(--farbe-pfirsich);
  color: var(--farbe-schwarz);
  line-height: 1;
  text-decoration: none;
}

.termin__wochentag,
.termin__monat {
  font-size: 0.75rem;
  font-weight: var(--gewicht-text-mittel);
}

.termin__tag {
  margin-block: 0.15rem;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.7rem;
  color: var(--farbe-lila);
}

.termin__tag--offen {
  margin-block: 0.6rem;
}

.termin__titel {
  margin: 0;
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: var(--groesse-m);
  text-transform: none;
}

.termin__titel a {
  color: var(--farbe-schwarz);
  text-decoration: none;
}

.termin__titel a:hover {
  color: var(--farbe-lila);
  text-decoration: underline;
}

.termin__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 0.5rem;
  margin: 0.2rem 0 0;
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}

.termin__meta > span:not(.stempel) + span:not(.stempel)::before {
  content: '·';
  margin-right: 0.5rem;
}

.termin__anmeldungen {
  display: grid;
  gap: 0.3rem;
  color: var(--farbe-schwarz);
  font-size: var(--groesse-xs);
  text-decoration: none;
}

a.termin__anmeldungen:hover {
  color: var(--farbe-lila);
}

.termin__anmeldungen--aus {
  color: var(--vh-gedaempft);
}

.termin__balken {
  height: 0.4rem;
  overflow: hidden;
  border-radius: 999px;
  background: #efe8dc;
}

.termin__balken > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--farbe-lila);
}

.termin__balken--voll > span {
  background: #d8342a;
}

.termin__aktionen {
  display: flex;
  align-items: center;
  gap: var(--abstand-2xs);
}

.termin__mehr {
  position: relative;
}

.termin__mehr-knopf {
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--vh-rand);
  border-radius: 50%;
  background: var(--farbe-weiss);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.termin__mehr-knopf:hover {
  background: var(--farbe-pfirsich);
}

.termin__menue {
  position: absolute;
  top: calc(100% + 0.3rem);
  right: 0;
  z-index: 10;
  min-width: 14rem;
  margin: 0;
  padding: 0.3rem;
  border: 1px solid var(--vh-rand);
  border-radius: 0.6rem;
  background: var(--farbe-weiss);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.15);
  list-style: none;
}

.termin__menue a,
.termin__menue button {
  display: block;
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 0;
  border-radius: 0.4rem;
  background: none;
  color: var(--farbe-schwarz);
  font: inherit;
  font-size: var(--groesse-xs);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.termin__menue a:hover,
.termin__menue button:hover {
  background: var(--farbe-pfirsich);
}

.termin__menue .termin__weg {
  color: #a1260d;
}

@media (max-width: 48rem) {
  .termin {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    padding: var(--abstand-s);
  }

  .termin__anmeldungen,
  .termin__aktionen {
    grid-column: 2;
  }
}
</style>
