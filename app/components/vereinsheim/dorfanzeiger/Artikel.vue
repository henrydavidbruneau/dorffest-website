<script setup lang="ts">
// Artikel je Ausgabe (Reihenfolge mit ↑ ↓), Ausgaben verwalten
interface Ausgabe { id: number, nummer: number, jahreszeit: string, jahr: number, motto: string | null, erschienen_am: string | null }
interface ArtikelZeile { id: number, status: string, titel: string, slug: string, sort: number | null, titelgeschichte: boolean, hervorgehoben: boolean, ausgabe: number | null, ressort: { name: string } | null, autor_in: string | null }

const { zeige, fehler } = useVereinsheimMeldung()
const ausgabeWahl = ref<number | 'ohne' | null>(null)

const { data, refresh } = useAsyncData('vh-artikel', async () => {
  const [ausgaben, artikel] = await Promise.all([
    vh.liste<Ausgabe>('ausgaben', { fields: 'id,nummer,jahreszeit,jahr,motto,erschienen_am', sort: '-nummer' }),
    vh.liste<ArtikelZeile>('artikel', { fields: 'id,status,titel,slug,sort,titelgeschichte,hervorgehoben,ausgabe,ressort.name,autor_in', sort: 'sort,id' }),
  ])
  return { ausgaben, artikel }
}, { server: false, default: () => ({ ausgaben: [], artikel: [] }) })

// Standard: die neueste erschienene Ausgabe
watch(() => data.value.ausgaben, (liste) => {
  if (ausgabeWahl.value === null && liste.length) ausgabeWahl.value = (liste.find(a => a.erschienen_am) ?? liste[0])!.id
}, { immediate: true })

const liste = computed(() => data.value.artikel.filter(a => ausgabeWahl.value === 'ohne' ? !a.ausgabe : a.ausgabe === ausgabeWahl.value))
const JAHRESZEIT: Record<string, string> = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' }

async function verschieben(index: number, richtung: -1 | 1) {
  const neu = [...liste.value]
  const ziel = index + richtung
  if (ziel < 0 || ziel >= neu.length) return
  ;[neu[index], neu[ziel]] = [neu[ziel]!, neu[index]!]
  try {
    // alle Positionen neu durchnummerieren (1, 2, 3 …), nur geänderte speichern
    await Promise.all(neu.map((a, i) => (a.sort === i + 1 ? null : vh.aendern('artikel', a.id, { sort: i + 1 }))))
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function duplizieren(a: ArtikelZeile) {
  try {
    const voll = await vh.eins<Record<string, unknown>>('artikel', a.id, { fields: FELDER_ARTIKEL.map(f => f.feld).join(',') })
    const kopie = await vh.anlegen<{ id: number }>('artikel', { ...voll, slug: `${a.slug}-kopie-${Date.now().toString(36).slice(-4)}`, titel: `${a.titel} (Kopie)`, status: 'draft', titelgeschichte: false })
    zeige('Kopie liegt im Fach.')
    await navigateTo(`/vereinsheim/dorfanzeiger/artikel/${kopie.id}`)
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(a: ArtikelZeile) {
  if (!window.confirm(`Wirklich in den Papierkorb? „${a.titel}“ ist dann weg.`)) return
  try {
    await vh.loeschen('artikel', a.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <div class="tisch">
    <aside class="tisch__ausgaben">
      <BasisNotizzettel farbe="gelb" befestigung="pin" :drehung="-1" class="tisch__ausgaben-zettel">
        <h2>Ausgaben</h2>
        <ul>
          <li v-for="a in data.ausgaben" :key="a.id">
            <button type="button" :aria-pressed="ausgabeWahl === a.id" @click="ausgabeWahl = a.id">
              Nr. {{ a.nummer }} · {{ JAHRESZEIT[a.jahreszeit] }} {{ a.jahr }}
            </button>
            <span v-if="!a.erschienen_am" class="tisch__klein">angekündigt</span>
            <NuxtLink :to="`/vereinsheim/dorfanzeiger/ausgabe/${a.id}`" class="tisch__klein">bearbeiten</NuxtLink>
          </li>
          <li>
            <button type="button" :aria-pressed="ausgabeWahl === 'ohne'" @click="ausgabeWahl = 'ohne'">ohne Ausgabe</button>
          </li>
        </ul>
        <NuxtLink to="/vereinsheim/dorfanzeiger/ausgabe/neu" class="tisch__neu handschrift">+ neue Ausgabe</NuxtLink>
      </BasisNotizzettel>
    </aside>

    <section class="tisch__artikel" aria-label="Artikel der Ausgabe">
      <div class="tisch__kopf">
        <p class="handschrift tisch__hinweis">Reihenfolge = Reihenfolge im Dorfanzeiger</p>
        <BasisKnopf :to="`/vereinsheim/dorfanzeiger/artikel/neu${typeof ausgabeWahl === 'number' ? `?ausgabe=${ausgabeWahl}` : ''}`">+ Neuer Artikel</BasisKnopf>
      </div>
      <p v-if="!liste.length" class="handschrift tisch__leer">Noch kein Manuskript auf dem Tisch.</p>
      <ol class="tisch__liste">
        <li v-for="(a, i) in liste" :key="a.id" class="manuskript" :style="{ '--drehung': `${(i % 3 - 1) * 0.6}deg` }">
          <div class="manuskript__pfeile">
            <button type="button" :disabled="i === 0" :aria-label="`${a.titel} nach oben`" @click="verschieben(i, -1)">↑</button>
            <button type="button" :disabled="i === liste.length - 1" :aria-label="`${a.titel} nach unten`" @click="verschieben(i, 1)">↓</button>
          </div>
          <div class="manuskript__text">
            <p class="manuskript__dach">
              {{ a.titelgeschichte ? 'Titelgeschichte · ' : '' }}{{ a.ressort?.name ?? 'ohne Ressort' }}{{ a.hervorgehoben ? ' · auf der Startseite' : '' }}
            </p>
            <NuxtLink :to="`/vereinsheim/dorfanzeiger/artikel/${a.id}`" class="manuskript__titel">{{ a.titel }}</NuxtLink>
            <p v-if="a.autor_in" class="manuskript__autor handschrift">von {{ a.autor_in }}</p>
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
  </div>
</template>

<style scoped>
.tisch {
  display: grid;
  grid-template-columns: 17rem 1fr;
  gap: var(--abstand-l);
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.tisch__ausgaben-zettel {
  padding: 2.6rem var(--abstand-m) var(--abstand-m);
}

.tisch__ausgaben h2 {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
}

.tisch__ausgaben ul {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
  margin: 0 0 var(--abstand-s);
  padding: 0;
  list-style: none;
}

.tisch__ausgaben li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.5rem;
}

.tisch__ausgaben button {
  padding: 0.15rem 0.4rem;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tisch__ausgaben button[aria-pressed='true'] {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.tisch__klein {
  font-size: var(--groesse-xs);
  color: var(--farbe-schwarz);
}

.tisch__neu {
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.tisch__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  margin-bottom: var(--abstand-m);
}

.tisch__hinweis,
.tisch__leer {
  margin: 0;
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-s);
}

.tisch__leer {
  font-size: var(--groesse-hand-l);
}

.tisch__liste {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-m);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Manuskript: liniertes Blatt mit Rand */
.manuskript {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--abstand-m);
  padding: var(--abstand-m);
  background:
    linear-gradient(90deg, transparent 3.2rem, rgb(232 130 12 / 0.35) 3.2rem 3.3rem, transparent 3.3rem),
    var(--farbe-weiss);
  box-shadow: var(--schatten-zettel);
  rotate: var(--drehung);
}

.manuskript__pfeile {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.manuskript__pfeile button {
  width: 2rem;
  height: 2rem;
  border: 1.5px solid var(--farbe-schwarz);
  border-radius: var(--radius-s);
  background: var(--farbe-creme);
  font: inherit;
  cursor: pointer;
}

.manuskript__pfeile button:disabled {
  opacity: 0.3;
  cursor: default;
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
  font-size: var(--groesse-h4);
  line-height: 1.1;
  color: var(--farbe-lila);
  text-transform: uppercase;
  text-decoration: none;
}

.manuskript__autor {
  margin: 0.2rem 0 0;
  font-size: var(--groesse-hand-s);
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
  .tisch {
    grid-template-columns: 1fr;
  }

  .manuskript {
    grid-template-columns: auto 1fr;
  }
}
</style>
