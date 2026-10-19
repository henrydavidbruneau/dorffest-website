<script setup lang="ts">
// Moderation einer öffentlichen Wand (Leserbriefe, Ideenwand): neueste zuerst, ausblenden/löschen
const props = defineProps<{ collection: 'leserbriefe' | 'ideen', leer: string }>()
interface Eintrag { id: number, status: string, name: string | null, text: string, date_created: string, artikel?: { titel: string } | null }
const { zeige, fehler } = useVereinsheimMeldung()
const felder = props.collection === 'leserbriefe' ? 'id,status,name,text,date_created,artikel.titel' : 'id,status,name,text,date_created'
const { data, refresh } = useAsyncData(`vh-wand-${props.collection}`, () => vh.liste<Eintrag>(props.collection, { fields: felder, sort: '-date_created', limit: 300 }), { server: false, default: () => [] })

const neu = (e: Eintrag) => Date.now() - Date.parse(e.date_created) < 7 * 86_400_000

async function umschalten(e: Eintrag) {
  try {
    await vh.aendern(props.collection, e.id, { status: e.status === 'published' ? 'hidden' : 'published' })
    zeige(e.status === 'published' ? 'Ausgeblendet – auf der Website nicht mehr zu sehen.' : 'Wieder sichtbar.')
    await refresh()
  }
  catch (err) {
    fehler(err)
  }
}

async function loeschen(e: Eintrag) {
  if (!window.confirm('Diesen Zettel wirklich in den Papierkorb?')) return
  try {
    await vh.loeschen(props.collection, e.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (err) {
    fehler(err)
  }
}
</script>

<template>
  <div class="wand">
    <p v-if="!data.length" class="handschrift wand__leer">{{ leer }}</p>
    <ul class="wand__liste">
      <li v-for="(e, i) in data" :key="e.id">
        <BasisNotizzettel :farbe="e.status === 'published' ? (i % 3 === 0 ? 'gelb' : i % 3 === 1 ? 'weiss' : 'pfirsich') : 'papier'" befestigung="pin" :drehung="(i % 4 - 1.5)" class="wand__zettel" :class="{ 'wand__zettel--aus': e.status !== 'published' }">
          <VereinsheimSticker v-if="neu(e) && e.status === 'published'" :anzahl="1" text="neu" />
          <p class="wand__text">{{ e.text }}</p>
          <p class="wand__wer handschrift">– {{ e.name || 'anonym' }}, {{ datumLang(e.date_created) }}</p>
          <p v-if="e.artikel" class="wand__zu">zu „{{ e.artikel.titel }}“</p>
          <div class="wand__aktionen">
            <VereinsheimStempel v-if="e.status !== 'published'" status="hidden" />
            <button type="button" @click="umschalten(e)">{{ e.status === 'published' ? 'Ausblenden' : 'Wieder zeigen' }}</button>
            <button type="button" class="wand__weg" @click="loeschen(e)">Löschen</button>
          </div>
        </BasisNotizzettel>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wand {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.wand__leer {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-l);
}

.wand__liste {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.wand__zettel {
  height: 100%;
  padding: 2.6rem var(--abstand-m) var(--abstand-m);
}

.wand__zettel--aus {
  opacity: 0.75;
}

.wand__text {
  margin: 0 0 var(--abstand-2xs);
  white-space: pre-line;
}

.wand__wer {
  margin: 0;
  font-size: var(--groesse-hand-s);
}

.wand__zu {
  margin: 0;
  font-size: var(--groesse-xs);
}

.wand__aktionen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-2xs) var(--abstand-s);
  margin-top: var(--abstand-xs);
  font-size: var(--groesse-xs);
}

.wand__aktionen button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.wand__aktionen .wand__weg {
  color: #a1260d;
}
</style>
