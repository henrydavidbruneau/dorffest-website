<script setup lang="ts">
// Höchstens vier veröffentlichte Kleinanzeigen (Directus-Flow sichert das zusätzlich ab)
interface Anzeige { id: number, status: string, ueberschrift: string, kurzbeschreibung: string | null, link_text: string | null, ziel_email: string | null, sort: number | null }
const { zeige, fehler } = useVereinsheimMeldung()
const { data, refresh } = useAsyncData('vh-kleinanzeigen', () => vh.liste<Anzeige>('kleinanzeigen', { fields: '*', sort: 'sort,id' }), { server: false, default: () => [] })
const veroeffentlicht = computed(() => data.value.filter(a => a.status === 'published').length)

async function umschalten(a: Anzeige) {
  try {
    await vh.aendern('kleinanzeigen', a.id, { status: a.status === 'published' ? 'draft' : 'published' })
    zeige(a.status === 'published' ? 'Abgehängt.' : 'Hängt am Brett!')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(a: Anzeige) {
  if (!window.confirm(`„${a.ueberschrift}“ wirklich in den Papierkorb?`)) return
  try {
    await vh.loeschen('kleinanzeigen', a.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <div class="anzeigen">
    <div class="anzeigen__kopf">
      <p class="handschrift anzeigen__hinweis">{{ veroeffentlicht }} von 4 Plätzen im Dorfanzeiger belegt</p>
      <BasisKnopf to="/vereinsheim/dorfanzeiger/kleinanzeige/neu">+ Neue Anzeige</BasisKnopf>
    </div>
    <p v-if="veroeffentlicht >= 4" class="anzeigen__voll">Alle vier Plätze sind belegt. Neue Anzeigen landen im Fach, bis du eine andere abhängst.</p>
    <ul class="anzeigen__liste">
      <li v-for="(a, i) in data" :key="a.id">
        <BasisNotizzettel :farbe="a.status === 'published' ? 'weiss' : 'papier'" befestigung="pin" :drehung="(i % 2 ? 1.5 : -1.5)" class="anzeige">
          <VereinsheimStempel :status="a.status" class="anzeige__stempel" />
          <h2 class="anzeige__titel">{{ a.ueberschrift }}</h2>
          <p>{{ a.kurzbeschreibung }}</p>
          <p class="handschrift anzeige__link">→ {{ a.link_text }} <small>({{ a.ziel_email }})</small></p>
          <div class="anzeige__aktionen">
            <NuxtLink :to="`/vereinsheim/dorfanzeiger/kleinanzeige/${a.id}`">Bearbeiten</NuxtLink>
            <button type="button" :disabled="a.status !== 'published' && veroeffentlicht >= 4" @click="umschalten(a)">
              {{ a.status === 'published' ? 'Abhängen' : 'Ans Brett hängen' }}
            </button>
            <button type="button" class="anzeige__weg" @click="loeschen(a)">Löschen</button>
          </div>
        </BasisNotizzettel>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.anzeigen {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.anzeigen__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  margin-bottom: var(--abstand-l);
}

.anzeigen__hinweis {
  margin: 0;
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-m);
}

.anzeigen__voll {
  padding: var(--abstand-xs) var(--abstand-s);
  background: var(--farbe-pfirsich);
}

.anzeigen__liste {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.anzeige {
  height: 100%;
  padding: 2.6rem var(--abstand-m) var(--abstand-m);
}

.anzeige__stempel {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
}

.anzeige__titel {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-m);
}

.anzeige p {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.anzeige__link {
  font-size: var(--groesse-hand-s) !important;
  color: var(--farbe-orange-text);
}

.anzeige__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs) var(--abstand-s);
  font-size: var(--groesse-xs);
}

.anzeige__aktionen a,
.anzeige__aktionen button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.anzeige__aktionen button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.anzeige__aktionen .anzeige__weg {
  color: #a1260d;
}
</style>
