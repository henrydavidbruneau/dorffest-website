<script setup lang="ts">
// Kontakt-Postfach (nur Vorstand): ein kleines Mailprogramm – Eingang/Gesendet lesen,
// antworten und neue Mails schreiben. Absender ist immer die Kontakt-Adresse des Vereins.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Post · Vereinsheim', robots: 'noindex, nofollow' })

const { ich } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const verein = useVerein()
const post = useVereinsheimPost()

const ordner = ref<PostOrdner>('eingang')
const data = computed(() => post.listen.value[ordner.value] ?? null)
const laedtListe = computed(() => !!post.laedt.value[ordner.value])

// Gemerkte Liste sofort zeigen, im Hintergrund nachschauen; danach jede Minute
onMounted(() => post.aktualisieren(ordner.value))
watch(ordner, (o) => {
  offen.value = null
  entwurf.value = null
  post.aktualisieren(o)
})
useAutoAktualisierung(() => post.aktualisieren(ordner.value))

async function frischHolen() {
  await post.aktualisieren(ordner.value, true)
  if (!post.fehler.value) zeige('Postfach ist aktuell.')
}

// „vor 2 Min. aktualisiert“ – tickt mit
const jetzt = ref(Date.now())
useAutoAktualisierung(() => (jetzt.value = Date.now()), 15_000)
const aktualisiertText = computed(() => {
  if (!data.value) return ''
  const s = Math.round((jetzt.value - data.value.um) / 1000)
  return s < 60 ? 'gerade aktualisiert' : `vor ${Math.round(s / 60)} Min. aktualisiert`
})

const offen = ref<PostMail | null>(null)
const laedt = ref<number | null>(null)

async function oeffnen(m: PostMailKopf) {
  entwurf.value = null
  const o = ordner.value
  laedt.value = m.uid
  try {
    const mail = await post.mail(o, m.uid)
    if (o === ordner.value) offen.value = mail
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

function antworten(m: PostMail) {
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
    post.vergessen()
    await post.aktualisieren(ordner.value, true)
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
    <VereinsheimKopf titel="Die" hervorhebung="Post" :zusatz="`Kontakt-Postfach ${verein.kontakt_email}`">
      <template v-if="data?.eingerichtet">
        <BasisKnopf groesse="klein" @click="neueMail">+ Neue Mail</BasisKnopf>
        <BasisKnopf variante="outline" groesse="klein" :disabled="laedtListe" @click="frischHolen">{{ laedtListe ? 'Schaut nach …' : 'Aktualisieren' }}</BasisKnopf>
      </template>
      <BasisKnopf v-if="data?.webmail" :to="data.webmail" target="_blank" variante="outline" groesse="klein">Webmail ↗</BasisKnopf>
    </VereinsheimKopf>

    <div v-if="data && !data.eingerichtet" class="vh-karte post__fehlt">
      <h2>Noch kein Postfach angeschlossen</h2>
      <p>Sobald die Zugangsdaten des Postfachs auf Netlify stehen (<code>NUXT_IMAP_HOST</code>, <code>NUXT_IMAP_BENUTZER</code>, <code>NUXT_IMAP_PASSWORT</code>), liegt die Post hier.</p>
    </div>

    <template v-else>
      <div class="post__leiste">
        <VereinsheimReiter v-model="ordner" :reiter="[{ key: 'eingang', text: 'Eingang' }, { key: 'gesendet', text: 'Gesendet' }]" />
        <p class="post__stand" aria-live="polite">{{ laedtListe && data ? 'schaut nach neuer Post …' : aktualisiertText }}</p>
      </div>

      <div class="post__raster">
        <ul class="post__liste vh-karte" :aria-label="ordner === 'eingang' ? 'Eingang' : 'Gesendet'">
          <li v-if="!data && laedtListe" class="post__hinweis">Post wird geholt …</li>
          <li v-else-if="!data && post.fehler.value" class="post__hinweis" role="alert">{{ post.fehler.value }}</li>
          <li v-else-if="data && !data.mails.length" class="post__hinweis">{{ ordner === 'eingang' ? 'Der Briefkasten ist leer.' : 'Noch nichts verschickt.' }}</li>
          <li v-for="m in data?.mails ?? []" :key="m.uid">
            <button
              type="button"
              class="brief"
              :class="{ 'brief--neu': !m.gelesen && ordner === 'eingang', 'brief--offen': offen?.uid === m.uid }"
              :aria-pressed="offen?.uid === m.uid"
              @pointerenter="post.vorladen(ordner, m.uid)"
              @focus="post.vorladen(ordner, m.uid)"
              @click="oeffnen(m)"
            >
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
              <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird gesendet …' : 'Senden' }}</BasisKnopf>
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

          <p v-else class="post__hinweis">Mail links auswählen oder eine neue schreiben.</p>
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
  margin: 0;
  padding: var(--abstand-m);
  color: var(--vh-gedaempft);
  list-style: none;
}

.post__leiste {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-xs) var(--abstand-m);
  margin-bottom: var(--abstand-m);
}

.post__leiste :deep(.unterreiter) {
  margin: 0;
}

.post__stand {
  margin: 0;
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
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
  overflow: hidden;
  padding: 0;
  list-style: none;
}

.brief {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.1rem var(--abstand-2xs);
  width: 100%;
  padding: var(--abstand-xs) var(--abstand-s);
  border: 0;
  border-bottom: 1px solid var(--vh-rand);
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
  box-shadow: inset 4px 0 0 var(--farbe-lila);
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
  color: var(--vh-gedaempft);
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
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-weiss);
  box-shadow: var(--vh-schatten);
}

.post__kopf h2 {
  margin: 0 0 var(--abstand-2xs);
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-fett);
  font-size: var(--groesse-l);
  text-transform: none;
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
  border-top: 1px solid var(--vh-rand);
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
}

.schreiben__titel {
  margin: 0;
  font-weight: var(--gewicht-text-fett);
  font-size: var(--groesse-l);
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
