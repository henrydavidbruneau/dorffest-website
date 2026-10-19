<script setup lang="ts">
// Gastbeiträge: private Links erstellen/widerrufen und der Posteingang (Briefe öffnen,
// in Zeitungs-Vorschau lesen, annehmen → Artikel-Entwurf, oder ablehnen)
interface Einladung { id: number, status: string, schluessel: string, name: string, ressort: { name: string } | null, gueltig_bis: string | null, mehrfach: boolean, notiz: string | null, date_created: string }
interface Brief { id: number, status: string, titel: string, teaser: string | null, inhalt: string, bild: string | null, bildunterschrift: string | null, foto_von: string | null, autor_in: string, email: string, date_created: string, ressort: { name: string } | null, einladung: { name: string } | null, artikel: number | null }

const { zeige, fehler } = useVereinsheimMeldung()

const { data, refresh } = useAsyncData('vh-gastbeitraege', async () => {
  const [einladungen, briefe, ressorts] = await Promise.all([
    vh.liste<Einladung>('gastbeitrag_einladungen', { fields: 'id,status,schluessel,name,ressort.name,gueltig_bis,mehrfach,notiz,date_created', sort: '-date_created' }),
    vh.liste<Brief>('gastbeitraege', { fields: 'id,status,titel,teaser,inhalt,bild,bildunterschrift,foto_von,autor_in,email,date_created,ressort.name,einladung.name,artikel', sort: '-date_created' }),
    vh.liste<{ id: number, name: string }>('ressorts', { fields: 'id,name', sort: 'sort' }),
  ])
  return { einladungen, briefe, ressorts }
}, { server: false, default: () => ({ einladungen: [], briefe: [], ressorts: [] }) })

const eingang = computed(() => data.value.briefe.filter(b => b.status === 'eingereicht'))
const erledigt = computed(() => data.value.briefe.filter(b => b.status !== 'eingereicht'))
const linkVon = (schluessel: string) => `${window.location.origin}/gastbeitrag/${schluessel}`

// ---------- Link erstellen ----------
const form = reactive({ name: '', ressort: '', gueltig_bis: '', mehrfach: false, notiz: '' })
const neuerLink = ref('')

function zufallsSchluessel() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function linkErstellen() {
  if (!form.name.trim()) return fehler({ statusMessage: 'Für wen ist der Link? Bitte einen Namen eintragen.' })
  try {
    const schluessel = zufallsSchluessel()
    await vh.anlegen('gastbeitrag_einladungen', {
      schluessel,
      name: form.name.trim(),
      ressort: form.ressort ? Number(form.ressort) : null,
      gueltig_bis: form.gueltig_bis || null,
      mehrfach: form.mehrfach,
      notiz: form.notiz || null,
      status: 'offen',
    })
    neuerLink.value = linkVon(schluessel)
    Object.assign(form, { name: '', ressort: '', gueltig_bis: '', mehrfach: false, notiz: '' })
    await kopieren(neuerLink.value)
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
}

async function kopieren(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    zeige('Link kopiert – jetzt privat weitergeben.')
  }
  catch {
    window.prompt('Link kopieren:', text)
  }
}

async function widerrufen(e: Einladung) {
  if (!window.confirm(`Link für ${e.name} widerrufen? Danach kann darüber niemand mehr einreichen.`)) return
  try {
    await vh.aendern('gastbeitrag_einladungen', e.id, { status: 'widerrufen' })
    zeige('Link widerrufen.')
    await refresh()
  }
  catch (err) {
    fehler(err)
  }
}

// ---------- Posteingang ----------
const offen = ref<number | null>(null)
const vorschau = ref<Record<number, string>>({})
const ablehnText = ref('')
const arbeitet = ref(false)

async function oeffnen(b: Brief) {
  offen.value = offen.value === b.id ? null : b.id
  ablehnText.value = ''
  if (!vorschau.value[b.id]) {
    vorschau.value[b.id] = (await $fetch<{ html: string }>('/api/vereinsheim/vorschau', { method: 'POST', body: { markdown: b.inhalt } }).catch(() => ({ html: '' }))).html
  }
}

async function entscheiden(b: Brief, aktion: 'annehmen' | 'ablehnen') {
  if (aktion === 'ablehnen' && !window.confirm(`Beitrag „${b.titel}“ ablehnen?${ablehnText.value ? ' Die Nachricht geht per Mail an die Person.' : ''}`)) return
  arbeitet.value = true
  try {
    const r = await $fetch<{ artikel?: number }>(`/api/vereinsheim/gastbeitraege/${b.id}/${aktion}`, { method: 'POST', body: { nachricht: ablehnText.value } })
    if (aktion === 'annehmen' && r.artikel) {
      zeige('Angenommen! Der Artikel liegt jetzt als Entwurf auf dem Tisch.')
      await navigateTo(`/vereinsheim/dorfanzeiger/artikel/${r.artikel}`)
      return
    }
    zeige('Abgelehnt.')
    offen.value = null
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  arbeitet.value = false
}
</script>

<template>
  <div class="gast">
    <section class="gast__links" aria-labelledby="links-titel">
      <BasisNotizzettel farbe="gelb" befestigung="pin" :drehung="-0.8" class="gast__zettel">
        <h2 id="links-titel">Link für einen Gastbeitrag</h2>
        <p>Der Link ist privat: Wer ihn hat, kann einen Beitrag einreichen. Gib ihn nur der Person, die schreiben soll.</p>
        <form class="gast__form" @submit.prevent="linkErstellen">
          <BasisFeld v-model="form.name" label="Für wen?" name="name" required hinweis="steht in der Begrüßung: „Hallo Marta!“" :maxlength="120" />
          <BasisFeld v-model="form.ressort" label="Rubrik (Vorauswahl)" name="ressort" :optionen="{ '': '– frei –', ...Object.fromEntries(data.ressorts.map(r => [r.id, r.name])) }" />
          <BasisFeld v-model="form.gueltig_bis" label="Gültig bis" name="gueltig_bis" type="date" hinweis="leer = unbegrenzt" />
          <label class="gast__haken"><input v-model="form.mehrfach" type="checkbox"> mehrere Beiträge über diesen Link (z.B. für eine Gruppe)</label>
          <BasisFeld v-model="form.notiz" label="Notiz (intern)" name="notiz" mehrzeilig :zeilen="2" hinweis="worum soll es gehen?" />
          <BasisKnopf type="submit">Link erstellen &amp; kopieren</BasisKnopf>
        </form>
        <p v-if="neuerLink" class="gast__neu">
          <span class="handschrift">Frisch gedruckt:</span>
          <code>{{ neuerLink }}</code>
          <button type="button" @click="kopieren(neuerLink)">nochmal kopieren</button>
        </p>
      </BasisNotizzettel>

      <div v-if="data.einladungen.length" class="gast__liste-links">
        <h3>Alle Links</h3>
        <ul>
          <li v-for="e in data.einladungen" :key="e.id">
            <span><strong>{{ e.name }}</strong>{{ e.ressort ? ` · ${e.ressort.name}` : '' }}{{ e.gueltig_bis ? ` · bis ${datumLang(e.gueltig_bis)}` : '' }}{{ e.mehrfach ? ' · mehrfach' : '' }}</span>
            <VereinsheimStempel :status="e.status" />
            <button v-if="e.status !== 'widerrufen'" type="button" @click="kopieren(linkVon(e.schluessel))">kopieren</button>
            <button v-if="e.status !== 'widerrufen'" type="button" class="gast__weg" @click="widerrufen(e)">widerrufen</button>
          </li>
        </ul>
      </div>
    </section>

    <section class="gast__eingang" aria-labelledby="eingang-titel">
      <h2 id="eingang-titel" class="gast__korb">📥 Posteingang <span v-if="eingang.length">({{ eingang.length }})</span></h2>
      <p v-if="!eingang.length" class="handschrift gast__leer">Keine neuen Briefe. Vielleicht mal einen Link verschicken?</p>
      <ul class="gast__briefe">
        <li v-for="b in eingang" :key="b.id" class="brief" :class="{ 'brief--offen': offen === b.id }">
          <button type="button" class="brief__umschlag" :aria-expanded="offen === b.id" @click="oeffnen(b)">
            <span class="brief__marke" aria-hidden="true">✉</span>
            <span class="brief__von handschrift">von {{ b.autor_in }}{{ b.einladung ? ` (Link für ${b.einladung.name})` : '' }}</span>
            <span class="brief__titel">{{ b.titel }}</span>
            <span class="brief__meta">{{ b.ressort?.name ?? 'ohne Rubrik' }} · {{ datumLang(b.date_created) }}{{ b.bild ? ' · mit Foto' : '' }}</span>
          </button>
          <div v-if="offen === b.id" class="brief__inhalt">
            <article class="brief__zeitung">
              <p class="brief__dach">{{ b.ressort?.name }}</p>
              <h3>{{ b.titel }}</h3>
              <p v-if="b.teaser" class="brief__teaser">{{ b.teaser }}</p>
              <figure v-if="b.bild">
                <img :src="vh.bild(b.bild, 900)" :alt="b.titel">
                <figcaption>{{ [b.bildunterschrift, b.foto_von ? `Foto: ${b.foto_von}` : ''].filter(Boolean).join(' · ') }}</figcaption>
              </figure>
              <!-- eslint-disable-next-line vue/no-v-html -- vom eigenen Server gerendert, rohes HTML escaped -->
              <div class="vh-text" v-html="vorschau[b.id] ?? ''" />
              <p class="brief__autor">Text: {{ b.autor_in }} · Rückfragen: <a :href="`mailto:${b.email}`">{{ b.email }}</a></p>
            </article>
            <div class="brief__entscheidung">
              <BasisKnopf :disabled="arbeitet" @click="entscheiden(b, 'annehmen')">Annehmen → Artikel-Entwurf</BasisKnopf>
              <details class="brief__ablehnen">
                <summary>Ablehnen …</summary>
                <BasisFeld v-model="ablehnText" label="Nachricht an die Person" name="ablehnen" mehrzeilig :zeilen="3" hinweis="leer = keine Mail" />
                <BasisKnopf variante="outline" :disabled="arbeitet" @click="entscheiden(b, 'ablehnen')">Ablehnen</BasisKnopf>
              </details>
            </div>
          </div>
        </li>
      </ul>

      <details v-if="erledigt.length" class="gast__erledigt">
        <summary>Schon entschieden ({{ erledigt.length }})</summary>
        <ul>
          <li v-for="b in erledigt" :key="b.id">
            „{{ b.titel }}“ von {{ b.autor_in }} <VereinsheimStempel :status="b.status" />
            <NuxtLink v-if="b.artikel" :to="`/vereinsheim/dorfanzeiger/artikel/${b.artikel}`">zum Artikel</NuxtLink>
          </li>
        </ul>
      </details>
    </section>
  </div>
</template>

<style scoped>
.gast {
  display: grid;
  grid-template-columns: minmax(0, 24rem) 1fr;
  gap: var(--abstand-l);
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.gast__zettel {
  padding: 2.6rem var(--abstand-m) var(--abstand-m);
}

.gast h2 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
}

.gast__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.gast__haken {
  display: flex;
  gap: var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.gast__neu {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: var(--abstand-s);
  word-break: break-all;
}

.gast__neu button,
.gast__liste-links button {
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

.gast__liste-links {
  margin-top: var(--abstand-l);
  padding: var(--abstand-m);
  background: var(--farbe-creme);
  box-shadow: var(--schatten-zettel);
}

.gast__liste-links h3 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-m);
}

.gast__liste-links ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gast__liste-links li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem var(--abstand-s);
  padding: var(--abstand-2xs) 0;
  border-bottom: 1px dashed var(--farbe-spaltenlinie);
  font-size: var(--groesse-xs);
}

.gast__liste-links .gast__weg {
  color: #a1260d;
}

.gast__korb {
  display: inline-block;
  padding: 0.3rem 0.9rem;
  background: var(--farbe-creme);
  box-shadow: var(--schatten-zettel);
}

.gast__leer {
  font-size: var(--groesse-hand-l);
  padding: 0.1rem 0.6rem;
  background: rgb(255 253 247 / 0.85);
}

.gast__briefe {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-m);
  margin: var(--abstand-m) 0 0;
  padding: 0;
  list-style: none;
}

/* Briefumschlag */
.brief__umschlag {
  position: relative;
  display: grid;
  width: 100%;
  padding: var(--abstand-m) var(--abstand-l) var(--abstand-m) var(--abstand-m);
  border: 0;
  background:
    linear-gradient(160deg, transparent 49.5%, rgb(0 0 0 / 0.08) 50%, transparent 50.5%),
    linear-gradient(20deg, transparent 49.5%, rgb(0 0 0 / 0.08) 50%, transparent 50.5%),
    #f3e7cf;
  box-shadow: var(--schatten-zettel);
  font: inherit;
  text-align: left;
  cursor: pointer;
  rotate: -0.6deg;
}

.brief:nth-child(even) .brief__umschlag {
  rotate: 0.8deg;
}

.brief__marke {
  position: absolute;
  top: 0.6rem;
  right: 0.8rem;
  padding: 0.1rem 0.4rem;
  border: 2px dashed #d8342a;
  color: #d8342a;
  font-size: 1.4rem;
}

.brief__von {
  font-size: var(--groesse-hand-m);
}

.brief__titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h4);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.brief__meta {
  font-size: var(--groesse-xs);
}

.brief__inhalt {
  padding: var(--abstand-m);
  background: var(--farbe-creme);
  box-shadow: var(--schatten-karte);
}

.brief__zeitung {
  padding: var(--abstand-m);
  background: var(--farbe-zeitungspapier);
  border: 1px solid var(--farbe-spaltenlinie);
}

.brief__dach {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.brief__zeitung h3 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h3);
  color: var(--farbe-lila);
}

.brief__teaser {
  font-weight: var(--gewicht-text-normal);
}

.brief__zeitung img {
  max-width: 100%;
  height: auto;
}

.brief__zeitung figure {
  margin: 0 0 var(--abstand-s);
}

.brief__zeitung figcaption {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
}

.brief__autor {
  font-size: var(--groesse-xs);
}

.brief__entscheidung {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--abstand-m);
  margin-top: var(--abstand-m);
}

.brief__ablehnen summary,
.gast__erledigt summary {
  cursor: pointer;
  text-decoration: underline;
}

.brief__ablehnen[open] {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-xs);
  min-width: min(100%, 20rem);
}

.gast__erledigt {
  margin-top: var(--abstand-l);
  padding: var(--abstand-s) var(--abstand-m);
  background: rgb(255 253 247 / 0.9);
}

.gast__erledigt li {
  margin: 0.3rem 0;
}

@media (max-width: 860px) {
  .gast {
    grid-template-columns: 1fr;
  }
}
</style>
