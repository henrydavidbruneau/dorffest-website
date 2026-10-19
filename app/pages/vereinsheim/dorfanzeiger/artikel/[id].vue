<script setup lang="ts">
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Artikel · Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { zeige } = useVereinsheimMeldung()
const JAHRESZEIT: Record<string, string> = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' }

const { data: beziehungen } = useAsyncData('vh-artikel-beziehungen', async () => {
  const [ressorts, ausgaben] = await Promise.all([
    vh.liste<{ id: number, name: string }>('ressorts', { fields: 'id,name', sort: 'sort' }),
    vh.liste<{ id: number, nummer: number, jahreszeit: string, jahr: number }>('ausgaben', { fields: 'id,nummer,jahreszeit,jahr', sort: '-nummer' }),
  ])
  return {
    ressort: Object.fromEntries(ressorts.map(r => [r.id, r.name])),
    ausgabe: Object.fromEntries(ausgaben.map(a => [a.id, `Nr. ${a.nummer} · ${JAHRESZEIT[a.jahreszeit]} ${a.jahr}`])),
  }
}, { server: false })

const vorlage = computed(() => ({
  status: 'draft', titelgeschichte: false, hervorgehoben: false,
  ausgabe: route.query.ausgabe ? Number(route.query.ausgabe) : null,
}))

// Lesedauer aus dem Text schätzen (≈ 200 Wörter pro Minute), wenn niemand sie eingetragen hat
function vorbereiten(daten: Record<string, unknown>) {
  if (daten.lesedauer_minuten || !daten.inhalt) return daten
  return { ...daten, lesedauer_minuten: Math.max(1, Math.round(String(daten.inhalt).split(/\s+/).length / 200)) }
}

// Höchstens eine Titelgeschichte je Ausgabe: die bisherige wird zur normalen Geschichte
async function gespeichert(daten: Record<string, unknown>) {
  if (!daten.titelgeschichte || !daten.ausgabe) return
  const andere = await vh.liste<{ id: number, titel: string }>('artikel', {
    fields: 'id,titel',
    filter: { titelgeschichte: { _eq: true }, ausgabe: { _eq: daten.ausgabe }, id: { _neq: daten.id ?? id.value } },
  })
  for (const a of andere) await vh.aendern('artikel', a.id, { titelgeschichte: false })
  if (andere.length) zeige(`„${andere[0]!.titel}“ ist jetzt keine Titelgeschichte mehr.`)
}
</script>

<template>
  <VereinsheimFormularSeite
    :id="id"
    collection="artikel"
    :felder="FELDER_ARTIKEL"
    :beziehungen="beziehungen ?? undefined"
    :vorlage="vorlage"
    :vorbereiten="vorbereiten"
    zurueck="/vereinsheim/dorfanzeiger/artikel"
    art="Artikel"
    @gespeichert="gespeichert"
  >
    <template #oben="{ daten }">
      <p v-if="daten.status === 'published'" class="artikel-link">
        <a :href="`/dorfanzeiger/${daten.slug}`" target="_blank" rel="noopener">→ im Dorfanzeiger ansehen ↗</a>
      </p>
    </template>
  </VereinsheimFormularSeite>
</template>

<style scoped>
.artikel-link {
  margin: 0 0 var(--abstand-l);
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
}

.artikel-link a {
  color: var(--farbe-orange-text);
}
</style>
