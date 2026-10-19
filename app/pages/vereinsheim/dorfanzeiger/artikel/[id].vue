<script setup lang="ts">
// Artikel schreiben – mit Vorschau genau so, wie er im Dorfanzeiger erscheint (<ZeitungArtikel>)
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Artikel · Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { zeige, fehler } = useVereinsheimMeldung()
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

// Neue Artikel: Name der angemeldeten Person als Autor*in vorausgefüllt (änderbar)
const { ich } = useVereinsheimIch()
const vorlage = computed(() => ({
  status: 'draft', titelgeschichte: false, hervorgehoben: false,
  autor_in: [ich.value?.first_name, ich.value?.last_name].filter(Boolean).join(' ') || null,
  ausgabe: route.query.ausgabe ? Number(route.query.ausgabe) : null,
}))

// Lesedauer aus dem Text schätzen (≈ 200 Wörter pro Minute), wenn niemand sie eingetragen hat
function vorbereiten(daten: Record<string, unknown>) {
  if (daten.lesedauer_minuten || !daten.inhalt) return daten
  return { ...daten, lesedauer_minuten: Math.max(1, Math.round(String(daten.inhalt).split(/\s+/).length / 200)) }
}

async function gespeichert(daten: Record<string, unknown>) {
  const artikelId = daten.id ?? id.value
  // Höchstens eine Titelgeschichte je Ausgabe: die bisherige wird zur normalen Geschichte
  if (daten.titelgeschichte && daten.ausgabe) {
    const andere = await vh.liste<{ id: number, titel: string }>('artikel', {
      fields: 'id,titel',
      filter: { titelgeschichte: { _eq: true }, ausgabe: { _eq: daten.ausgabe }, id: { _neq: artikelId } },
    })
    for (const a of andere) await vh.aendern('artikel', a.id, { titelgeschichte: false })
    if (andere.length) zeige(`„${andere[0]!.titel}“ ist jetzt keine Titelgeschichte mehr.`)
  }
  // Gastbeitrag erschienen? Dann bekommt die Autor*in Bescheid (einmalig, prüft der Server)
  if (daten.status === 'published') {
    const r = await $fetch<{ gesendet: boolean }>(`/api/vereinsheim/artikel/${artikelId}/erschienen`, { method: 'POST' }).catch(() => ({ gesendet: false }))
    if (r.gesendet) zeige('Die Gastautor*in hat eine „Dein Beitrag ist erschienen“-Mail bekommen.')
  }
}

// ---------- Vorschau ----------
const formular = ref<{ daten: Record<string, unknown> } | null>(null)
const ansicht = ref<'schreiben' | 'vorschau'>('schreiben')
const vorschauHtml = ref('')

async function zurVorschau() {
  ansicht.value = 'vorschau'
  const inhalt = String(formular.value?.daten.inhalt ?? '')
  try {
    vorschauHtml.value = (await $fetch<{ html: string }>('/api/vereinsheim/vorschau', { method: 'POST', body: { markdown: inhalt } })).html
  }
  catch (e) {
    fehler(e)
  }
  window.scrollTo({ top: 0 })
}

const vorschau = computed(() => {
  const d = formular.value?.daten ?? {}
  const text = (k: string) => (d[k] as string | null) ?? null
  return {
    titel: text('titel') ?? 'Ohne Titel',
    teaser: text('teaser') ?? '',
    autor_in: text('autor_in'),
    autor_in_bild: text('autor_in_bild'),
    veroeffentlicht_am: text('veroeffentlicht_am'),
    datum_text: text('datum_text'),
    lesedauer_minuten: (d.lesedauer_minuten as number | null) ?? (d.inhalt ? Math.max(1, Math.round(String(d.inhalt).split(/\s+/).length / 200)) : null),
    bild: text('bild'),
    bild_alt: text('bild_alt'),
    bildunterschrift: text('bildunterschrift'),
    inhalt_html: vorschauHtml.value,
    aufruf_titel: text('aufruf_titel'),
    aufruf_text: text('aufruf_text'),
    aufruf_knopf: text('aufruf_knopf'),
    aufruf_link: text('aufruf_link'),
  }
})
const dachzeile = computed(() => {
  const d = formular.value?.daten ?? {}
  const ressort = beziehungen.value?.ressort[String(d.ressort ?? '')] ?? ''
  return `${d.titelgeschichte ? 'Titelgeschichte · ' : ''}${ressort}`
})
</script>

<template>
  <div>
    <div v-show="ansicht === 'schreiben'">
      <VereinsheimFormularSeite
        :id="id"
        ref="formular"
        collection="artikel"
        :felder="FELDER_ARTIKEL"
        :gruppen="GRUPPEN_ARTIKEL"
        :beziehungen="beziehungen ?? undefined"
        :vorlage="vorlage"
        :vorbereiten="vorbereiten"
        zurueck="/vereinsheim/dorfanzeiger/artikel"
        art="Artikel"
        @gespeichert="gespeichert"
      >
        <template #oben="{ daten }">
          <p v-if="daten.status === 'published'" class="artikel-link">
            <a :href="`/dorfanzeiger/${daten.slug}`" target="_blank" rel="noopener">Im Dorfanzeiger ansehen ↗</a>
          </p>
        </template>
        <template #aktionen>
          <BasisKnopf groesse="klein" variante="outline" @click="zurVorschau">Vorschau</BasisKnopf>
        </template>
      </VereinsheimFormularSeite>
    </div>

    <div v-if="ansicht === 'vorschau'" class="vorschau">
      <div class="vorschau__leiste">
        <BasisKnopf groesse="klein" variante="hell" @click="ansicht = 'schreiben'">← Weiter schreiben</BasisKnopf>
        <p class="vorschau__hinweis">So erscheint der Artikel im Dorfanzeiger. Gespeichert wird erst beim Weiterschreiben mit „Speichern“.</p>
      </div>
      <article class="vorschau__blatt">
        <BasisKlebeband position="links" farbe="gelb" :drehung="-3" :breite="6" />
        <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" />
        <p class="vorschau__kopf">Der Königsdorfer Dorfanzeiger</p>
        <ZeitungArtikel :artikel="vorschau" :dachzeile="dachzeile" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.artikel-link {
  margin: 0;
  font-size: var(--groesse-xs);
}

.artikel-link a {
  color: var(--farbe-pfirsich);
}

.vorschau {
  margin-block: calc(-1 * var(--abstand-xl));
  margin-inline: calc(-1 * var(--seitenrand));
  padding: var(--abstand-l) var(--seitenrand) var(--abstand-xl);
  background: var(--farbe-lila);
}

.vorschau__leiste {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s) var(--abstand-m);
  max-width: 47rem;
  margin: 0 auto var(--abstand-l);
}

.vorschau__hinweis {
  flex: 1 1 16rem;
  margin: 0;
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}
/* wie das schmale Blatt auf der Artikelseite */
.vorschau__blatt {
  position: relative;
  max-width: 47rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3.9vw, 3.5rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-zeitungspapier);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
}

.vorschau__kopf {
  margin: 0;
  padding-bottom: 0.45rem;
  border-bottom: 4px double var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.15rem;
  text-transform: uppercase;
}
</style>
