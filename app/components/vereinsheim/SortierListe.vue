<script setup lang="ts">
// Einfache Liste mit Reihenfolge (↑ ↓), Status, Bearbeiten und Löschen (Stimmen, FAQ)
const props = defineProps<{ collection: string, titelFeld: string, unterFeld?: string, basis: string, leer: string }>()
interface Zeile { id: number, status: string, sort: number | null, [feld: string]: unknown }
const { zeige, fehler } = useVereinsheimMeldung()
const felder = ['id', 'status', 'sort', props.titelFeld, props.unterFeld].filter(Boolean).join(',')
const { data, refresh } = useAsyncData(`vh-sortier-${props.collection}`, () => vh.liste<Zeile>(props.collection, { fields: felder, sort: 'sort,id' }), { server: false, default: () => [] })

async function verschieben(index: number, richtung: -1 | 1) {
  const neu = [...data.value]
  const ziel = index + richtung
  if (ziel < 0 || ziel >= neu.length) return
  ;[neu[index], neu[ziel]] = [neu[ziel]!, neu[index]!]
  try {
    await Promise.all(neu.map((z, i) => (z.sort === i + 1 ? null : vh.aendern(props.collection, z.id, { sort: i + 1 }))))
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function umschalten(z: Zeile) {
  try {
    await vh.aendern(props.collection, z.id, { status: z.status === 'published' ? 'draft' : 'published' })
    zeige(z.status === 'published' ? 'Abgehängt – liegt im Fach.' : 'Hängt am Brett!')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(z: Zeile) {
  if (!window.confirm(`„${z[props.titelFeld]}“ wirklich in den Papierkorb?`)) return
  try {
    await vh.loeschen(props.collection, z.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <div class="sortier">
    <p v-if="!data.length" class="handschrift sortier__leer">{{ leer }}</p>
    <ol class="sortier__liste">
      <li v-for="(z, i) in data" :key="z.id" class="sortier__zeile">
        <div class="sortier__pfeile">
          <button type="button" :disabled="i === 0" :aria-label="`${z[titelFeld]} nach oben`" @click="verschieben(i, -1)">↑</button>
          <button type="button" :disabled="i === data.length - 1" :aria-label="`${z[titelFeld]} nach unten`" @click="verschieben(i, 1)">↓</button>
        </div>
        <div class="sortier__text">
          <NuxtLink :to="`${basis}/${z.id}`" class="sortier__titel">{{ z[titelFeld] }}</NuxtLink>
          <p v-if="unterFeld && z[unterFeld]" class="sortier__unter">{{ String(z[unterFeld]).slice(0, 140) }}</p>
          <div class="sortier__aktionen">
            <NuxtLink :to="`${basis}/${z.id}`">Bearbeiten</NuxtLink>
            <button type="button" @click="umschalten(z)">{{ z.status === 'published' ? 'Abhängen' : 'Ans Brett hängen' }}</button>
            <button type="button" class="sortier__weg" @click="loeschen(z)">Löschen</button>
          </div>
        </div>
        <VereinsheimStempel :status="z.status" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.sortier__leer {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-l);
}

.sortier__liste {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sortier__zeile {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--abstand-m);
  padding: var(--abstand-s) var(--abstand-m);
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-zettel);
}

.sortier__zeile:nth-child(odd) {
  rotate: -0.4deg;
}

.sortier__pfeile {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sortier__pfeile button {
  width: 2rem;
  height: 2rem;
  border: 1.5px solid var(--farbe-schwarz);
  border-radius: var(--radius-s);
  background: var(--farbe-creme);
  font: inherit;
  cursor: pointer;
}

.sortier__pfeile button:disabled {
  opacity: 0.3;
  cursor: default;
}

.sortier__titel {
  font-weight: var(--gewicht-text-normal);
  font-size: var(--groesse-l);
  color: var(--farbe-lila);
}

.sortier__unter {
  margin: 0.2rem 0 0;
  font-size: var(--groesse-xs);
}

.sortier__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs) var(--abstand-m);
  margin-top: var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.sortier__aktionen a,
.sortier__aktionen button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.sortier__aktionen .sortier__weg {
  color: #a1260d;
}
</style>
