<script setup lang="ts">
// Alle Artikel, neueste zuerst (wie auf der Website: der neueste steht dort groß oben) – ohne Ausgaben
interface ArtikelZeile {
  id: number
  status: string
  titel: string
  slug: string
  hervorgehoben: boolean
  ressort: { name: string, slug: string } | null
  autor_in: string | null
  veroeffentlicht_am: string | null
  date_created: string
}

const { zeige, fehler } = useVereinsheimMeldung()
const filter = ref<'alle' | 'veroeffentlicht' | 'entwuerfe'>('alle')

const { data, refresh, status } = useAsyncData('vh-artikel', () => vh.liste<ArtikelZeile>('artikel', {
  fields: 'id,status,titel,slug,hervorgehoben,ressort.name,ressort.slug,autor_in,veroeffentlicht_am,date_created',
}), { server: false, default: () => [] })

const wann = (a: ArtikelZeile) => a.veroeffentlicht_am ?? a.date_created
// wie auf der Website: nach Erscheinungsdatum, ohne Datum ans Ende (Entwürfe nach Anlagedatum)
const sortierZeit = (a: ArtikelZeile) => Date.parse(a.veroeffentlicht_am ?? (a.status === 'published' ? '' : a.date_created)) || 0
const sortiert = computed(() => [...data.value].sort((a, b) => sortierZeit(b) - sortierZeit(a) || b.id - a.id))
const liste = computed(() => sortiert.value.filter(a => filter.value === 'alle' || (filter.value === 'veroeffentlicht') === (a.status === 'published')))
const anzahl = computed(() => ({
  alle: data.value.length,
  veroeffentlicht: data.value.filter(a => a.status === 'published').length,
  entwuerfe: data.value.filter(a => a.status !== 'published').length,
}))
// Position auf der Website: 1 = groß oben, 2–4 = Reihe, danach Seitenspalte bzw. Archiv.
// Porträts laufen dort nicht in der Liste, sondern unter „Fünf Fragen an …“ (das neueste).
const istPortraet = (a: ArtikelZeile) => a.ressort?.slug === 'portraets'
const veroeffentlicht = computed(() => sortiert.value.filter(a => a.status === 'published'))
const platz = computed(() => new Map(veroeffentlicht.value.filter(a => !istPortraet(a)).map((a, i) => [a.id, i])))
const neuestesPortraet = computed(() => veroeffentlicht.value.find(istPortraet)?.id)
function platzText(a: ArtikelZeile) {
  if (a.id === neuestesPortraet.value) return 'bei „Fünf Fragen an …“'
  const p = platz.value.get(a.id)
  if (p === undefined) return ''
  return p === 0 ? 'steht groß oben' : p < 4 ? 'in der Reihe' : ''
}

async function duplizieren(a: ArtikelZeile) {
  try {
    const voll = await vh.eins<Record<string, unknown>>('artikel', a.id, { fields: FELDER_ARTIKEL.map(f => f.feld).join(',') })
    const kopie = await vh.anlegen<{ id: number }>('artikel', { ...voll, slug: `${a.slug}-kopie-${Date.now().toString(36).slice(-4)}`, titel: `${a.titel} (Kopie)`, status: 'draft', veroeffentlicht_am: null })
    zeige('Kopie angelegt (als Entwurf).')
    await navigateTo(`/vereinsheim/dorfanzeiger/artikel/${kopie.id}`)
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(a: ArtikelZeile) {
  if (!window.confirm(`„${a.titel}“ wirklich löschen?`)) return
  try {
    await vh.loeschen('artikel', a.id)
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <section class="tisch" aria-label="Artikel">
    <div class="tisch__kopf">
      <VereinsheimReiter
        v-model="filter"
        :reiter="[
          { key: 'alle', text: `Alle · ${anzahl.alle}` },
          { key: 'veroeffentlicht', text: `Veröffentlicht · ${anzahl.veroeffentlicht}` },
          { key: 'entwuerfe', text: `Entwürfe · ${anzahl.entwuerfe}` },
        ]"
      />
      <BasisKnopf to="/vereinsheim/dorfanzeiger/artikel/neu" groesse="klein">+ Neuer Artikel</BasisKnopf>
    </div>
    <p class="tisch__hinweis">Der neueste veröffentlichte Artikel steht im Dorfanzeiger groß oben, die drei davor in der Reihe darunter, ältere in der Seitenspalte und im Archiv.</p>

    <p v-if="status === 'pending'" class="tisch__leer">Artikel werden geladen …</p>
    <p v-else-if="!liste.length" class="tisch__leer">{{ filter === 'entwuerfe' ? 'Keine Entwürfe.' : 'Noch kein Artikel geschrieben.' }}</p>
    <ol v-else class="tisch__liste">
      <li v-for="a in liste" :key="a.id" class="manuskript">
        <time :datetime="wann(a)" class="manuskript__datum">
          <span class="manuskript__tag">{{ tagZahl(wann(a)) }}</span>
          <span class="manuskript__monat">{{ monatKurz(wann(a)) }}</span>
        </time>
        <div class="manuskript__text">
          <p class="manuskript__dach">
            {{ a.ressort?.name ?? 'ohne Ressort' }}{{ a.hervorgehoben ? ' · auf der Startseite' : '' }}{{ platzText(a) ? ` · ${platzText(a)}` : '' }}
          </p>
          <NuxtLink :to="`/vereinsheim/dorfanzeiger/artikel/${a.id}`" class="manuskript__titel">{{ a.titel }}</NuxtLink>
          <p v-if="a.autor_in || (a.status === 'published' && !a.veroeffentlicht_am)" class="manuskript__autor">
            {{ a.autor_in ? `von ${a.autor_in}` : '' }}
            <span v-if="a.status === 'published' && !a.veroeffentlicht_am" class="manuskript__ohne-datum">· ohne Erscheinungsdatum – steht deshalb ganz hinten</span>
          </p>
          <div class="manuskript__aktionen">
            <NuxtLink :to="`/vereinsheim/dorfanzeiger/artikel/${a.id}`">Bearbeiten</NuxtLink>
            <a v-if="a.status === 'published'" :href="`/dorfanzeiger/${a.slug}`" target="_blank" rel="noopener">Ansehen ↗</a>
            <button type="button" @click="duplizieren(a)">Duplizieren</button>
            <button type="button" class="manuskript__weg" @click="loeschen(a)">Löschen</button>
          </div>
        </div>
        <VereinsheimStempel :status="a.status" />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.tisch__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
}

.tisch__kopf :deep(.unterreiter) {
  margin: 0;
}

.tisch__hinweis,
.tisch__leer {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.tisch__leer {
  padding-block: var(--abstand-l);
  font-size: var(--groesse-s);
}

.tisch__liste {
  margin: var(--abstand-m) 0 0;
  padding: 0;
  list-style: none;
}

/* eine Zeile im Inhaltsverzeichnis: Datum · Text · Status */
.manuskript {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  align-items: start;
  gap: var(--abstand-m);
  padding: var(--abstand-m) 0;
  border-top: 1px solid var(--farbe-spaltenlinie);
}

.manuskript__datum {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.manuskript__tag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.8rem;
}

.manuskript__monat {
  font-size: var(--groesse-xs);
  text-transform: uppercase;
}

.manuskript__dach {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.manuskript__titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  line-height: 1.05;
  color: var(--farbe-lila);
  text-transform: uppercase;
  text-decoration: none;
}

.manuskript__titel:hover {
  text-decoration: underline;
}

.manuskript__autor {
  margin: 0.2rem 0 0;
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}

.manuskript__ohne-datum {
  color: #a1260d;
}

.manuskript__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs) var(--abstand-m);
  margin-top: var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.manuskript__aktionen a,
.manuskript__aktionen button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.manuskript__aktionen .manuskript__weg {
  color: #a1260d;
}

@media (max-width: 800px) {
  .manuskript {
    grid-template-columns: 3rem 1fr;
  }

  .manuskript > .stempel {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
