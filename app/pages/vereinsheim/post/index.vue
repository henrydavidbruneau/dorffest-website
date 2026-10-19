<script setup lang="ts">
// Kontakt-Postfach (nur Vorstand): ein kleines Mailprogramm – Eingang/Gesendet lesen,
// antworten und neue Mails schreiben. Absender ist immer die Kontakt-Adresse des Vereins.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Post · Vereinsheim', robots: 'noindex, nofollow' })

interface MailKopf { uid: number, von: string, vonAdresse: string, an: string, betreff: string, datum: string, gelesen: boolean, beantwortet: boolean }
interface Mail extends MailKopf { text: string, anhaenge: { name: string, groesse: number }[] }

const { ich } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const verein = useVerein()

const ordner = ref<'eingang' | 'gesendet'>('eingang')
const { data, status, refresh } = useAsyncData(
  'vh-post',
  () => $fetch<{ eingerichtet: boolean, webmail: string, mails: MailKopf[] }>('/api/vereinsheim/post', { query: { ordner: ordner.value } }),
  { server: false, watch: [ordner] },
)
watch(ordner, () => {
  offen.value = null
  entwurf.value = null
})

const offen = ref<Mail | null>(null)
const laedt = ref<number | null>(null)

async function oeffnen(m: MailKopf) {
  laedt.value = m.uid
  entwurf.value = null
  try {
    offen.value = await $fetch<Mail>(`/api/vereinsheim/post/${m.uid}`, { query: { ordner: ordner.value } })
  }
  catch (e) {
    fehler(e)
  }
  laedt.value = null
}

// ---------- Schreiben ----------
interface Entwurf { an: string, betreff: string, text: string, antwortAuf?: number }
const entwurf = ref<Entwurf | null>(null)
const sendet = ref(false)

const gruss = computed(() => `\n\nViele Grüße\n${ich.value?.first_name ?? ''}\nfür Königsdorf rückt zusammen e.V.\n${verein.value.kontakt_email}`)

function neueMail() {
  offen.value = null
  entwurf.value = { an: '', betreff: '', text: gruss.value }
}

function antworten(m: Mail) {
  const zitat = m.text.split('\n').slice(0, 60).map(z => `> ${z}`).join('\n')
  entwurf.value = {
    an: m.vonAdresse,
    betreff: /^(re|aw):/i.test(m.betreff) ? m.betreff : `Re: ${m.betreff}`,
    text: `Hallo ${m.von.split(' ')[0]},\n\n${gruss.value}\n\nAm ${datumLang(m.datum)} schrieb ${m.von}:\n${zitat}`,
    antwortAuf: ordner.value === 'eingang' ? m.uid : undefined,
  }
}

async function senden() {
  if (!entwurf.value) return
  sendet.value = true
  try {
    const r = await $fetch<{ weg: 'postfach' | 'brevo' }>('/api/vereinsheim/post/senden', { method: 'POST', body: entwurf.value })
    zeige(r.weg === 'postfach' ? 'Ab in die Post!' : 'Ab in die Post! (über Brevo verschickt)')
    if (offen.value && entwurf.value.antwortAuf) offen.value = { ...offen.value, beantwortet: true }
    entwurf.value = null
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

function verwerfen() {
  if (entwurf.value && entwurf.value.text.trim() !== gruss.value.trim() && !window.confirm('Entwurf wegwerfen?')) return
  entwurf.value = null
}

function wann(iso: string) {
  return Date.now() - Date.parse(iso) < 86_400_000 ? uhrzeit(iso) : tagMonat(iso)
}

const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`)
</script>

<template>
  <div class="post">
    <VereinsheimKopf titel="Post" :zusatz="verein.kontakt_email">
      <template v-if="data?.eingerichtet">
        <BasisKnopf groesse="klein" @click="neueMail">+ Neue Mail</BasisKnopf>
        <BasisKnopf variante="outline" groesse="klein" @click="refresh()">Briefkasten leeren</BasisKnopf>
      </template>
      <BasisKnopf v-if="data?.webmail" :to="data.webmail" target="_blank" variante="outline" groesse="klein">Webmail ↗</BasisKnopf>
    </VereinsheimKopf>

    <BasisNotizzettel v-if="data && !data.eingerichtet" farbe="pfirsich" tape="mitte" :drehung="-0.5" class="post__fehlt">
      <h2>Noch kein Postfach angeschlossen</h2>
      <p>Sobald die Zugangsdaten des Postfachs auf Netlify stehen (<code>NUXT_IMAP_HOST</code>, <code>NUXT_IMAP_BENUTZER</code>, <code>NUXT_IMAP_PASSWORT</code>), liegt die Post hier.</p>
    </BasisNotizzettel>

    <template v-else>
      <VereinsheimReiter v-model="ordner" :reiter="[{ key: 'eingang', text: 'Eingang' }, { key: 'gesendet', text: 'Gesendet' }]" />

      <div class="post__raster">
        <ul class="post__liste" :aria-label="ordner === 'eingang' ? 'Eingang' : 'Gesendet'">
          <li v-if="status === 'pending'" class="handschrift post__hinweis">Schaue in den Briefkasten …</li>
          <li v-else-if="!data?.mails.length" class="handschrift post__hinweis">{{ ordner === 'eingang' ? 'Der Briefkasten ist leer.' : 'Noch nichts verschickt.' }}</li>
          <li v-for="m in data?.mails ?? []" :key="m.uid">
            <button type="button" class="brief" :class="{ 'brief--neu': !m.gelesen && ordner === 'eingang', 'brief--offen': offen?.uid === m.uid }" :aria-pressed="offen?.uid === m.uid" @click="oeffnen(m)">
              <span class="brief__von">
                <span v-if="m.beantwortet" class="brief__beantwortet" title="beantwortet">↩</span>
                {{ ordner === 'eingang' ? m.von : `an ${m.an}` }}
              </span>
              <span class="brief__zeit">{{ laedt === m.uid ? '…' : wann(m.datum) }}</span>
              <span class="brief__betreff">{{ m.betreff }}</span>
            </button>
          </li>
        </ul>

        <div class="post__rechts">
          <!-- Schreiben -->
          <form v-if="entwurf" class="schreiben" @submit.prevent="senden">
            <p class="schreiben__titel">{{ entwurf.antwortAuf ? 'Antwort' : 'Neue Mail' }}</p>
            <p class="schreiben__von">von <strong>{{ verein.kontakt_email }}</strong></p>
            <BasisFeld v-model="entwurf.an" label="An" name="an" type="email" required />
            <BasisFeld v-model="entwurf.betreff" label="Betreff" name="betreff" required :maxlength="200" />
            <BasisFeld v-model="entwurf.text" label="Text" name="text" mehrzeilig :zeilen="16" required />
            <div class="schreiben__knoepfe">
              <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird eingeworfen …' : 'Senden' }}</BasisKnopf>
              <button type="button" class="schreiben__weg" @click="verwerfen">Verwerfen</button>
            </div>
          </form>

          <!-- Lesen -->
          <article v-else-if="offen" class="post__mail" aria-live="polite">
            <header class="post__kopf">
              <h2>{{ offen.betreff }}</h2>
              <p>
                <strong>{{ offen.von }}</strong> &lt;{{ offen.vonAdresse }}&gt;<br>
                an {{ offen.an }} · {{ datumAusgeschrieben(offen.datum) }}, {{ uhrzeit(offen.datum) }} Uhr
                <span v-if="offen.beantwortet" class="post__beantwortet">· beantwortet</span>
              </p>
            </header>
            <div class="post__text">{{ offen.text || '(kein Text)' }}</div>
            <p v-if="offen.anhaenge.length" class="post__anhaenge">
              📎 {{ offen.anhaenge.map(a => `${a.name} (${kb(a.groesse)})`).join(' · ') }} – Anhänge im Webmail öffnen
            </p>
            <div class="post__aktionen">
              <BasisKnopf groesse="klein" @click="antworten(offen)">{{ ordner === 'eingang' ? 'Antworten' : 'Nochmal schreiben' }}</BasisKnopf>
            </div>
          </article>

          <p v-else class="handschrift post__hinweis">← Brief aussuchen oder eine neue Mail schreiben</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.post__hinweis {
  padding: var(--abstand-s);
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
  list-style: none;
}

.post__fehlt {
  max-width: 40rem;
  padding: var(--abstand-l);
}

.post__fehlt h2 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.post__raster {
  display: grid;
  grid-template-columns: minmax(0, 22rem) 1fr;
  gap: var(--abstand-l);
  align-items: start;
}

.post__liste {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: var(--strich-dicke) dashed var(--farbe-orange);
}

.brief {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.1rem var(--abstand-2xs);
  width: 100%;
  padding: var(--abstand-xs) var(--abstand-s);
  border: 0;
  border-bottom: 1px dashed var(--farbe-spaltenlinie);
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.brief:hover,
.brief--offen {
  background: var(--farbe-pfirsich);
}

.brief--offen {
  box-shadow: inset 4px 0 0 var(--farbe-orange);
}

.brief__von {
  overflow: hidden;
  font-size: var(--groesse-s);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brief__beantwortet {
  color: var(--farbe-orange-text);
}

.brief--neu .brief__von,
.brief--neu .brief__betreff {
  font-weight: var(--gewicht-text-fett);
}

.brief__zeit {
  font-size: var(--groesse-xs);
  color: var(--farbe-orange-text);
}

.brief__betreff {
  grid-column: 1 / -1;
  overflow: hidden;
  font-size: var(--groesse-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post__mail,
.schreiben {
  padding: var(--abstand-l);
  border-radius: var(--radius-l);
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-zettel);
}

.post__kopf h2 {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.post__kopf p {
  margin: 0;
  font-size: var(--groesse-xs);
}

.post__beantwortet {
  color: var(--farbe-orange-text);
}

.post__text {
  margin-top: var(--abstand-m);
  padding-top: var(--abstand-m);
  border-top: var(--strich-dicke) dashed var(--farbe-orange);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.post__anhaenge {
  font-size: var(--groesse-xs);
}

.post__aktionen {
  margin-top: var(--abstand-l);
}

.schreiben {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
  background: var(--farbe-pfirsich);
}

.schreiben__titel {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h4);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.schreiben__von {
  margin: 0;
  font-size: var(--groesse-xs);
}

.schreiben__knoepfe {
  display: flex;
  align-items: center;
  gap: var(--abstand-m);
}

.schreiben__weg {
  padding: 0;
  border: 0;
  background: none;
  color: #a1260d;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 760px) {
  .post__raster {
    grid-template-columns: 1fr;
  }
}
</style>
