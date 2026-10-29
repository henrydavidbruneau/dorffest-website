<script setup lang="ts">
// Wunschliste eines Termins moderieren (z.B. Songwünsche): Reihenfolge wie auf der Website
// (meiste Stimmen oben), ausblenden oder löschen. Neue Wünsche kommen per Push (Mein Profil).
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Wunschliste · Vereinsheim', robots: 'noindex, nofollow' })

interface Eintrag { id: number, status: 'published' | 'hidden', text: string, name: string | null, date_created: string }

const route = useRoute()
const id = Number(route.params.id)
const { zeige, fehler } = useVereinsheimMeldung()

const { data, refresh } = useAsyncData(`vh-wuensche-${id}`, async () => {
  const [termin, wuensche] = await Promise.all([
    vh.eins<{ titel: string, slug: string, status: string, wunschliste_frage?: string | null }>('termine', id, { fields: '*' }),
    vh.liste<Eintrag>('wuensche', { fields: 'id,status,text,name,date_created', filter: { termin: { _eq: id } } }),
  ])
  const zaehlung = wuensche.length
    ? await vh.liste<{ wunsch: number, count: { id: number | string } }>('wunsch_stimmen', { 'aggregate[count]': 'id', 'groupBy[]': 'wunsch', 'filter': { wunsch: { termin: { _eq: id } } } })
    : []
  const stimmen = new Map(zaehlung.map(z => [Number(z.wunsch), Number(z.count?.id) || 0]))
  const liste = wuensche
    .map(w => ({ ...w, stimmen: stimmen.get(w.id) ?? 0 }))
    .sort((a, b) => b.stimmen - a.stimmen || Date.parse(a.date_created) - Date.parse(b.date_created))
  return { termin, liste }
}, { server: false })

const sichtbar = computed(() => data.value?.liste.filter(w => w.status === 'published') ?? [])
const ausgeblendet = computed(() => data.value?.liste.filter(w => w.status !== 'published') ?? [])
const neu = (w: Eintrag) => Date.now() - Date.parse(w.date_created) < 2 * 86_400_000

async function umschalten(w: Eintrag) {
  try {
    await vh.aendern('wuensche', w.id, { status: w.status === 'published' ? 'hidden' : 'published' })
    zeige(w.status === 'published' ? 'Ausgeblendet – auf der Website nicht mehr zu sehen.' : 'Wieder sichtbar.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(w: Eintrag) {
  if (!window.confirm(`„${w.text}“ wirklich löschen? Die Stimmen dafür sind dann auch weg.`)) return
  try {
    await vh.loeschen('wuensche', w.id)
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}
</script>

<template>
  <div class="wl">
    <VereinsheimKopf :titel="data?.termin.titel ?? 'Wunschliste'" :zusatz="data?.termin.wunschliste_frage || 'Wunschliste'" :zurueck="{ to: `/vereinsheim/termine/${id}`, text: 'Zum Termin' }">
      <a v-if="data?.termin.status === 'published'" :href="`/termine/${data.termin.slug}#wunschliste`" target="_blank" rel="noopener" class="wl__link">Auf der Website ansehen ↗</a>
    </VereinsheimKopf>

    <p v-if="!data" class="vh-leer">Wird geladen …</p>
    <template v-else>
      <section class="vh-karte wl__karte" aria-labelledby="wl-sichtbar">
        <h2 id="wl-sichtbar" class="vh-karte__titel">Auf der Website · {{ sichtbar.length }}</h2>
        <p v-if="!sichtbar.length" class="vh-leer">Noch keine Wünsche.</p>
        <ol class="wl__liste">
          <li v-for="(w, i) in sichtbar" :key="w.id" class="wl__eintrag">
            <span class="wl__platz">{{ i + 1 }}.</span>
            <span class="wl__text">
              <strong>{{ w.text }}</strong><span v-if="neu(w)" class="wl__neu">neu</span>
              <small>{{ w.name ? `von ${w.name}` : 'ohne Namen' }} · {{ datumLang(w.date_created) }}</small>
            </span>
            <span class="wl__stimmen">{{ w.stimmen }} {{ w.stimmen === 1 ? 'Stimme' : 'Stimmen' }}</span>
            <span class="wl__aktionen">
              <button type="button" class="vh-aktion" @click="umschalten(w)">Ausblenden</button>
              <button type="button" class="vh-aktion vh-aktion--gefahr" @click="loeschen(w)">Löschen</button>
            </span>
          </li>
        </ol>
      </section>

      <section v-if="ausgeblendet.length" class="vh-karte wl__karte" aria-labelledby="wl-aus">
        <h2 id="wl-aus" class="vh-karte__titel">Ausgeblendet · {{ ausgeblendet.length }}</h2>
        <ul class="wl__liste">
          <li v-for="w in ausgeblendet" :key="w.id" class="wl__eintrag wl__eintrag--aus">
            <span class="wl__platz">–</span>
            <span class="wl__text">
              <strong>{{ w.text }}</strong>
              <small>{{ w.name ? `von ${w.name}` : 'ohne Namen' }} · {{ datumLang(w.date_created) }}</small>
            </span>
            <span class="wl__stimmen">{{ w.stimmen }} {{ w.stimmen === 1 ? 'Stimme' : 'Stimmen' }}</span>
            <span class="wl__aktionen">
              <button type="button" class="vh-aktion" @click="umschalten(w)">Wieder zeigen</button>
              <button type="button" class="vh-aktion vh-aktion--gefahr" @click="loeschen(w)">Löschen</button>
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.wl {
  display: grid;
  gap: var(--abstand-l);
}

.wl__link {
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}

.wl__liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

.wl__eintrag {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  gap: 0.25rem 0.75rem;
  align-items: center;
  padding-block: 0.7rem;
  border-bottom: 1px solid var(--vh-rand);
}

.wl__eintrag:last-child {
  border-bottom: 0;
}

.wl__eintrag--aus .wl__text {
  opacity: 0.6;
}

.wl__platz {
  font-weight: var(--gewicht-text-fett);
  color: var(--farbe-lila);
  text-align: right;
}

.wl__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
}

.wl__text small {
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}

.wl__neu {
  margin-left: 0.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--farbe-orange);
  color: var(--farbe-weiss);
  font-size: var(--groesse-xs);
}

.wl__stimmen {
  font-weight: var(--gewicht-text-mittel);
  white-space: nowrap;
}

.wl__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  grid-column: 2 / -1;
}

@media (min-width: 48rem) {
  .wl__eintrag {
    grid-template-columns: 2rem minmax(0, 1fr) auto auto;
  }

  .wl__aktionen {
    grid-column: auto;
  }
}
</style>
