<script setup lang="ts">
// Termine als Klemmbrett: kommend / vergangen / Entwürfe, mit Anmeldezahlen
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Termine · Vereinsheim', robots: 'noindex, nofollow' })

interface TerminZeile { id: number, status: string, titel: string, slug: string, beginn: string | null, ende: string | null, datum_text: string | null, plaetze: number | null, anmeldung_aktiv: boolean }

const { zeige, fehler } = useVereinsheimMeldung()
const ansicht = ref<'kommend' | 'vergangen' | 'entwuerfe'>('kommend')

const { data, refresh, status } = useAsyncData('vh-termine', async () => {
  const [termine, summen] = await Promise.all([
    vh.liste<TerminZeile>('termine', { fields: 'id,status,titel,slug,beginn,ende,datum_text,plaetze,anmeldung_aktiv', sort: 'beginn' }),
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
    zeige('Kopie liegt im Fach.')
    await navigateTo(`/vereinsheim/termine/${kopie.id}`)
  }
  catch (e) {
    fehler(e)
  }
}

async function loeschen(t: TerminZeile & { angemeldet: number }) {
  const zusatz = t.angemeldet ? ` Die ${t.angemeldet} Anmeldungen werden mitgelöscht.` : ''
  if (!window.confirm(`Wirklich in den Papierkorb? „${t.titel}“ ist dann weg.${zusatz}`)) return
  try {
    await vh.loeschen('termine', t.id)
    zeige('Zerknüllt und weg.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

function wann(t: TerminZeile) {
  if (!t.beginn) return { tag: t.datum_text ?? '?', zeit: 'Datum folgt' }
  return { tag: tagMonat(t.beginn), zeit: `${wochentagKurz(t.beginn)} ${uhrzeit(t.beginn)}` }
}
</script>

<template>
  <div>
    <VereinsheimKopf titel="Termine" zusatz="Was steht an?">
      <BasisKnopf to="/vereinsheim/termine/neu">+ Neuer Termin</BasisKnopf>
    </VereinsheimKopf>

    <div class="klemmbrett">
      <div class="klemmbrett__klammer" aria-hidden="true" />
      <div class="klemmbrett__papier">
        <div class="klemmbrett__reiter" role="tablist" aria-label="Welche Termine?">
          <button
            v-for="(text, key) in { kommend: 'Kommend', vergangen: 'Vergangen', entwuerfe: 'Entwürfe' }"
            :key="key"
            type="button"
            role="tab"
            :aria-selected="ansicht === key"
            @click="ansicht = key"
          >
            {{ text }} <span class="klemmbrett__zahl">{{ anzahl[key] }}</span>
          </button>
        </div>

        <p v-if="status === 'pending'" class="handschrift klemmbrett__leer">Blättere durch den Kalender …</p>
        <p v-else-if="!liste.length" class="handschrift klemmbrett__leer">
          {{ ansicht === 'entwuerfe' ? 'Keine Entwürfe – alles hängt am Brett.' : ansicht === 'kommend' ? 'Nichts geplant. Zeit für ein Fest?' : 'Noch nichts vorbei.' }}
        </p>
        <ul v-else class="klemmbrett__liste">
          <li v-for="t in liste" :key="t.id" class="termin">
            <div class="termin__datum">
              <span class="termin__tag">{{ wann(t).tag }}</span>
              <span class="termin__zeit">{{ wann(t).zeit }}</span>
            </div>
            <div class="termin__text">
              <NuxtLink :to="`/vereinsheim/termine/${t.id}`" class="termin__titel">{{ t.titel }}</NuxtLink>
              <span v-if="t.anmeldung_aktiv" class="termin__anmeldungen">
                {{ t.angemeldet }}{{ t.plaetze ? ` / ${t.plaetze}` : '' }} angemeldet
                <span v-if="t.plaetze && t.angemeldet >= t.plaetze" class="termin__voll">voll!</span>
              </span>
            </div>
            <VereinsheimStempel :status="t.status" />
            <div class="termin__aktionen">
              <NuxtLink :to="`/vereinsheim/termine/${t.id}`">Bearbeiten</NuxtLink>
              <NuxtLink :to="`/vereinsheim/termine/${t.id}/anmeldungen`">Anmeldungen</NuxtLink>
              <a v-if="t.status === 'published'" :href="`/termine/${t.slug}`" target="_blank" rel="noopener">Ansehen ↗</a>
              <button type="button" @click="duplizieren(t)">Duplizieren</button>
              <button type="button" class="termin__weg" @click="loeschen(t)">Löschen</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.klemmbrett {
  position: relative;
  max-width: 62rem;
  margin: 0 auto;
  padding: 2.4rem 1rem 1rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #8b5a2b, #6e4526);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.3);
}

.klemmbrett__klammer {
  position: absolute;
  top: -0.8rem;
  left: 50%;
  width: 9rem;
  height: 2.6rem;
  border-radius: 0.5rem 0.5rem 1rem 1rem;
  background: linear-gradient(180deg, #d9d9d9, #8f8f8f);
  box-shadow: 0 3px 4px rgb(0 0 0 / 0.35);
  translate: -50% 0;
}

.klemmbrett__papier {
  padding: var(--abstand-m) clamp(0.75rem, 3vw, 2rem) var(--abstand-l);
  background:
    linear-gradient(90deg, transparent 2.6rem, rgb(232 130 12 / 0.35) 2.6rem 2.7rem, transparent 2.7rem),
    repeating-linear-gradient(180deg, transparent 0 2.2rem, rgb(142 111 224 / 0.18) 2.2rem 2.25rem),
    var(--farbe-weiss);
}

.klemmbrett__reiter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs);
  margin-bottom: var(--abstand-m);
}

.klemmbrett__reiter button {
  padding: 0.35rem 0.9rem;
  border: 1.5px solid var(--farbe-schwarz);
  border-radius: 999px;
  background: var(--farbe-weiss);
  font: inherit;
  cursor: pointer;
}

.klemmbrett__reiter button[aria-selected='true'] {
  background: var(--farbe-lila);
  border-color: var(--farbe-lila);
  color: var(--farbe-creme);
}

.klemmbrett__zahl {
  font-weight: var(--gewicht-text-fett);
}

.klemmbrett__leer {
  font-size: var(--groesse-hand-l);
}

.klemmbrett__liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

.termin {
  display: grid;
  grid-template-columns: 6.5rem 1fr auto;
  align-items: center;
  gap: var(--abstand-2xs) var(--abstand-m);
  padding: var(--abstand-s) 0;
  border-bottom: 1.5px dashed var(--farbe-spaltenlinie);
}

.termin__datum {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.termin__tag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.8rem;
  color: var(--farbe-lila);
}

.termin__zeit {
  font-size: var(--groesse-xs);
}

.termin__text {
  display: flex;
  flex-direction: column;
}

.termin__titel {
  font-weight: var(--gewicht-text-normal);
  font-size: var(--groesse-l);
  color: var(--farbe-schwarz);
}

.termin__anmeldungen {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange-text);
}

.termin__voll {
  margin-left: 0.3rem;
  padding: 0 0.4rem;
  background: #d8342a;
  color: var(--farbe-weiss);
  font-family: var(--schrift-text);
  font-size: var(--groesse-xs);
}

.termin__aktionen {
  grid-column: 2 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-2xs) var(--abstand-m);
  font-size: var(--groesse-xs);
}

.termin__aktionen a,
.termin__aktionen button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.termin__aktionen .termin__weg {
  color: #a1260d;
}

@media (max-width: 560px) {
  .termin {
    grid-template-columns: 4.5rem 1fr;
  }

  .termin__aktionen {
    grid-column: 1 / -1;
  }
}
</style>
