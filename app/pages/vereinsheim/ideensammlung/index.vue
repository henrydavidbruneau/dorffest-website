<script setup lang="ts">
// Ideensammlung: Vorschläge sortieren, Ideenwand moderieren
// (Plenum-Erinnerungen stehen in der Anmeldeliste des Plenums und gehen automatisch raus)
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Ideensammlung · Vereinsheim', robots: 'noindex, nofollow' })

interface Vorschlag { id: number, status: string, name: string, email: string, idee: string, dorffest: boolean, selbst_mitmachen: boolean, notiz: string | null, date_created: string }

const reiter = ref('vorschlaege')
const { zeige, fehler } = useVereinsheimMeldung()
const STATUS = { neu: 'neu', in_planung: 'in Planung', umgesetzt: 'umgesetzt', abgelehnt: 'abgelehnt' }

const { data: vorschlaege, refresh: neuLaden } = useAsyncData('vh-vorschlaege', () => vh.liste<Vorschlag>('vorschlaege', { fields: '*', sort: '-date_created' }), { server: false, default: () => [] })

const neue = computed(() => vorschlaege.value.filter(v => v.status === 'neu').length)

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
</script>

<template>
  <div class="mit">
    <VereinsheimKopf hervorhebung="Ideensammlung" zusatz="Vorschläge von außen und die Ideenwand" />
    <VereinsheimReiter
      v-model="reiter"
      :reiter="[
        { key: 'vorschlaege', text: 'Vorschläge', anzahl: neue },
        { key: 'ideenwand', text: 'Ideenwand' },
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

    <VereinsheimPinnwand v-else collection="ideen" leer="Die Ideenwand ist noch leer." />

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

.vorschlag__speichern {
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
</style>
