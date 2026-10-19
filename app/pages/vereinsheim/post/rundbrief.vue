<script setup lang="ts">
// Rundbrief (nur Vorstand): an alle, die den Newsletter bestätigt haben (Brevo-Liste).
// Links schreiben, rechts sieht man die Mail so, wie sie ankommt. Entwürfe und verschickte Rundbriefe
// liegen in Directus `rundbriefe` (?id= bearbeiten, ?von= duplizieren); der Status bei Brevo steht dabei.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Rundbrief · Vereinsheim', robots: 'noindex, nofollow' })

interface Rundbrief { id: number, status: string, betreff: string, text: string, verschickt_am: string | null, empfaenger_anzahl: number | null, brevo_kampagne: number | null, date_updated: string | null, date_created: string }
interface Kampagne { id: number, betreff: string, am: string | null, status: string, statusText: string, zugestellt: number | null, geoeffnet: number | null, bounces: number | null }
interface Stand { eingerichtet: boolean, fehlt?: string[], abonnenten: number, rundbriefe: Rundbrief[], kampagnen: Kampagne[] }

const route = useRoute()
const { zeige, fehler } = useVereinsheimMeldung()
const { data, refresh } = useAsyncData('vh-rundbrief', () => $fetch<Stand>('/api/vereinsheim/rundbrief'), { server: false })

const VORLAGE = 'Hallo liebe Nachbar*innen,\n\n# Neues aus dem ==Dorf!==\n\n'
const brief = reactive<{ id: number | null, betreff: string, text: string }>({ id: null, betreff: '', text: VORLAGE })
const gespeichert = ref(JSON.stringify({ betreff: '', text: VORLAGE }))
const geaendert = computed(() => JSON.stringify({ betreff: brief.betreff, text: brief.text }) !== gespeichert.value)
const sendet = ref<'' | 'test' | 'alle' | 'speichern'>('')

function laden(r: { id?: number | null, betreff: string, text: string }) {
  brief.id = r.id ?? null
  brief.betreff = r.betreff
  brief.text = r.text
  gespeichert.value = r.id ? JSON.stringify({ betreff: r.betreff, text: r.text }) : ''
}

// ?id=… Entwurf weiterschreiben, ?von=… Kopie eines (verschickten) Rundbriefs
watch(() => [route.query.id, route.query.von, data.value] as const, ([id, von]) => {
  const quelle = data.value?.rundbriefe.find(r => String(r.id) === String(id ?? von))
  if (!quelle) return
  if (id && quelle.status === 'entwurf' && brief.id !== quelle.id) laden(quelle)
  if (von && !id) {
    laden({ betreff: quelle.betreff, text: quelle.text })
    navigateTo({ query: {} }, { replace: true })
    zeige('Kopie geladen – jetzt anpassen und speichern oder schicken.')
  }
}, { immediate: true })

// Vorschau = dasselbe HTML wie beim Versand (Logo von dieser Seite, Abmelde-Link nur angedeutet)
const vorschauHtml = (text: string) => mailHtml(`${text.trim() || '…'}\n\n${GRUSS}`, {
  basis: import.meta.client ? window.location.origin : '',
  rubrik: 'Rundbrief',
  grosserGruss: true,
  abmelden: '#',
})
const vorschau = computed(() => vorschauHtml(brief.text))

const fertig = computed(() => !!brief.betreff.trim() && brief.text.trim().length >= 10)

async function speichern(stumm = false) {
  sendet.value = 'speichern'
  try {
    const daten = { betreff: brief.betreff.trim() || 'Ohne Betreff', text: brief.text, status: 'entwurf' }
    if (brief.id) await vh.aendern('rundbriefe', brief.id, daten)
    else brief.id = (await vh.anlegen<{ id: number }>('rundbriefe', daten)).id
    gespeichert.value = JSON.stringify({ betreff: brief.betreff, text: brief.text })
    if (route.query.id !== String(brief.id)) navigateTo({ query: { id: brief.id } }, { replace: true })
    if (!stumm) zeige('Entwurf gespeichert.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = ''
}

async function schicken(test: boolean) {
  if (!test && !window.confirm(`Rundbrief „${brief.betreff}“ jetzt an ${data.value?.abonnenten ?? 0} Abonnent*innen schicken?`)) return
  sendet.value = test ? 'test' : 'alle'
  try {
    const r = await $fetch<{ an?: string }>('/api/vereinsheim/rundbrief', { method: 'POST', body: { ...brief, test } })
    if (test) {
      zeige(`Test ist unterwegs an ${r.an}.`)
    }
    else {
      zeige('An Brevo übergeben. Unten siehst du, ob Brevo ihn verschickt.')
      laden({ betreff: '', text: VORLAGE })
      gespeichert.value = JSON.stringify({ betreff: '', text: VORLAGE })
      await navigateTo({ query: {} }, { replace: true })
      await refresh()
    }
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = ''
}

function neu() {
  if (geaendert.value && !window.confirm('Ungespeicherte Änderungen verwerfen?')) return
  laden({ betreff: '', text: VORLAGE })
  gespeichert.value = JSON.stringify({ betreff: '', text: VORLAGE })
  navigateTo({ query: {} }, { replace: true })
}

async function loeschen(r: Rundbrief) {
  if (!window.confirm(`Entwurf „${r.betreff}“ löschen?`)) return
  try {
    await vh.loeschen('rundbriefe', r.id)
    if (brief.id === r.id) neu()
    zeige('Gelöscht.')
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

// Liste: unsere Rundbriefe mit Brevo-Status; Kampagnen, die nur Brevo kennt (vor der Liste verschickt), hinten dran
const kampagne = (id: number | null) => data.value?.kampagnen.find(k => k.id === id) ?? null
const nurBrevo = computed(() => (data.value?.kampagnen ?? []).filter(k => !data.value?.rundbriefe.some(r => r.brevo_kampagne === k.id)))
const offen = ref<number | null>(null)

function zahlen(k: Kampagne | null) {
  if (!k) return ''
  return [k.zugestellt !== null ? `${k.zugestellt} zugestellt` : '', k.geoeffnet !== null ? `${k.geoeffnet} geöffnet` : '', k.bounces ? `${k.bounces} nicht zustellbar` : ''].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="rb">
    <VereinsheimKopf :titel="brief.id ? 'Entwurf:' : 'Neuer'" hervorhebung="Rundbrief" :zusatz="data?.eingerichtet ? `an ${data.abonnenten} Abonnent*innen des Newsletters` : 'an alle, die den Newsletter bestätigt haben'" :zurueck="{ to: '/vereinsheim/post', text: 'Zur Post' }">
      <BasisKnopf v-if="brief.id || geaendert" variante="outline" groesse="klein" @click="neu">+ Neuer Rundbrief</BasisKnopf>
    </VereinsheimKopf>

    <div v-if="data && !data.eingerichtet" class="vh-karte rb__fehlt">
      Brevo ist noch nicht eingerichtet. Auf Netlify fehlt: <code>{{ data.fehlt?.join(', ') }}</code>.
      (Nach dem Eintragen einmal neu deployen.) Einen Test an dich kannst du trotzdem schicken.
    </div>

    <div class="rb__raster">
      <form class="vh-karte rb__form" @submit.prevent="schicken(false)">
        <BasisFeld v-model="brief.betreff" label="Betreff" name="betreff" required :maxlength="200" />
        <VereinsheimMarkdownFeld
          v-model="brief.text"
          label="Text"
          art="mail"
          bild-ordner="rundbrief"
          pflicht
          hinweis="erste Zeile „Hallo …“ wird handschriftlich · # Überschrift · ==Hervorhebung== · Gruß und Abmelde-Link kommen automatisch dazu."
        />
        <div class="rb__aktionen">
          <BasisKnopf variante="outline" groesse="klein" :disabled="!geaendert || !!sendet" @click="speichern()">{{ sendet === 'speichern' ? 'Speichert …' : geaendert ? 'Entwurf speichern' : 'Gespeichert' }}</BasisKnopf>
          <BasisKnopf variante="outline" groesse="klein" :disabled="!fertig || !!sendet" @click="schicken(true)">{{ sendet === 'test' ? 'Schickt …' : 'Test an mich' }}</BasisKnopf>
          <BasisKnopf type="submit" :disabled="!fertig || !!sendet || !data?.eingerichtet">
            {{ sendet === 'alle' ? 'Wird übergeben …' : `An ${data?.abonnenten ?? 0} schicken` }}
          </BasisKnopf>
        </div>
      </form>

      <section class="rb__vorschau" aria-label="Vorschau">
        <p class="rb__vorschau-kopf"><span>Betreff:</span> {{ brief.betreff || '…' }}</p>
        <iframe :srcdoc="vorschau" title="Vorschau des Rundbriefs" class="rb__mail" sandbox="" />
      </section>
    </div>

    <section v-if="data?.rundbriefe.length || nurBrevo.length" class="vh-karte rb__liste" aria-labelledby="liste-titel">
      <h2 id="liste-titel">Entwürfe &amp; verschickte Rundbriefe</h2>
      <ul>
        <li v-for="r in data?.rundbriefe" :key="r.id" class="rb__eintrag" :class="{ 'rb__eintrag--aktiv': brief.id === r.id }">
          <div class="rb__zeile">
            <div>
              <strong>{{ r.betreff }}</strong>
              <p class="rb__info">
                <span class="rb__status" :class="`rb__status--${r.status === 'entwurf' ? 'entwurf' : kampagne(r.brevo_kampagne)?.status ?? 'unbekannt'}`">
                  {{ r.status === 'entwurf' ? 'Entwurf' : kampagne(r.brevo_kampagne)?.statusText ?? 'an Brevo übergeben' }}
                </span>
                {{ r.status === 'entwurf' ? `zuletzt ${datumLang(r.date_updated ?? r.date_created)}` : r.verschickt_am ? datumLang(r.verschickt_am) : '' }}
                {{ r.empfaenger_anzahl !== null && r.status !== 'entwurf' ? ` · an ${r.empfaenger_anzahl}` : '' }}
                {{ zahlen(kampagne(r.brevo_kampagne)) ? ` · ${zahlen(kampagne(r.brevo_kampagne))}` : '' }}
              </p>
            </div>
            <div class="rb__knoepfe">
              <NuxtLink v-if="r.status === 'entwurf'" :to="{ query: { id: r.id } }">Bearbeiten</NuxtLink>
              <button v-else type="button" :aria-expanded="offen === r.id" @click="offen = offen === r.id ? null : r.id">{{ offen === r.id ? 'Zuklappen' : 'Ansehen' }}</button>
              <NuxtLink :to="{ query: { von: r.id } }">Duplizieren</NuxtLink>
              <button v-if="r.status === 'entwurf'" type="button" class="rb__weg" @click="loeschen(r)">Löschen</button>
            </div>
          </div>
          <iframe v-if="offen === r.id" :srcdoc="vorschauHtml(r.text)" :title="`Rundbrief ${r.betreff}`" class="rb__mail rb__mail--klein" sandbox="" />
        </li>
        <li v-for="k in nurBrevo" :key="`b${k.id}`" class="rb__eintrag">
          <div class="rb__zeile">
            <div>
              <strong>{{ k.betreff }}</strong>
              <p class="rb__info">
                <span class="rb__status" :class="`rb__status--${k.status}`">{{ k.statusText }}</span>
                {{ k.am ? datumLang(k.am) : '' }}{{ zahlen(k) ? ` · ${zahlen(k)}` : '' }} · nur in Brevo gespeichert
              </p>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.rb__fehlt {
  margin-bottom: var(--abstand-m);
  font-size: var(--groesse-s);
}

.rb__raster {
  display: grid;
  gap: var(--abstand-l);
  align-items: start;
}

@media (min-width: 64rem) {
  .rb__raster {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .rb__vorschau {
    position: sticky;
    top: var(--abstand-m);
  }
}

.rb__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.rb__aktionen {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--abstand-xs);
}

.rb__vorschau-kopf {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.rb__vorschau-kopf span {
  color: var(--vh-gedaempft);
}

.rb__mail {
  display: block;
  width: 100%;
  height: min(75vh, 46rem);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-lila);
}

.rb__liste {
  margin-top: var(--abstand-xl);
}

.rb__liste h2 {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.rb__liste ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rb__eintrag {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vh-rand);
  font-size: var(--groesse-s);
}

.rb__eintrag--aktiv strong {
  color: var(--farbe-lila);
}

.rb__zeile {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem var(--abstand-m);
}

.rb__info {
  margin: 0.2rem 0 0;
  font-size: var(--groesse-xs);
  color: var(--vh-gedaempft);
}

.rb__status {
  display: inline-block;
  margin-right: 0.35rem;
  padding: 0 0.5rem;
  border-radius: 999px;
  background: #ede9e0;
  color: #3d3a35;
}

.rb__status--sent {
  background: #dcefe0;
  color: #1f5e30;
}

.rb__status--suspended,
.rb__status--draft {
  background: #fbe3dc;
  color: #a1260d;
}

.rb__status--queued,
.rb__status--in_process {
  background: var(--farbe-gelb);
}

.rb__knoepfe {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--abstand-2xs) var(--abstand-m);
  font-size: var(--groesse-xs);
}

.rb__knoepfe a,
.rb__knoepfe button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.rb__knoepfe .rb__weg {
  color: #a1260d;
}

.rb__mail--klein {
  height: 34rem;
  margin-top: var(--abstand-s);
}
</style>
