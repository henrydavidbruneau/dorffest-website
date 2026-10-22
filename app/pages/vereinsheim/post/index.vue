<script setup lang="ts">
// Kontakt-Postfach (nur Vorstand): ein kleines Mailprogramm – Eingang/Gesendet lesen,
// antworten (auch allen), löschen (Papierkorb) und neue Mails schreiben. Absender ist immer die Kontakt-Adresse des Vereins.
// Mails lassen sich für eine Person markieren: sie sieht sie hervorgehoben und im Reiter „Für mich“.
import type { KontextEintrag } from '~/utils/kontextmenue'

definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Post · Vereinsheim', robots: 'noindex, nofollow' })

const { ich } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const verein = useVerein()
const post = useVereinsheimPost()
const mk = usePostMarkierungen()

type Reiter = PostOrdner | 'fuermich'
const reiter = ref<Reiter>('eingang')
// Ordner der Liste (bei „Für mich“ bleibt der Eingang die Grundlage für Kopf und Webmail-Link)
const listenOrdner = computed<PostOrdner>(() => (reiter.value === 'gesendet' ? 'gesendet' : 'eingang'))
const data = computed(() => post.listen.value[listenOrdner.value] ?? null)
const laedtListe = computed(() => !!post.laedt.value[listenOrdner.value])

function markierungenLaden() {
  return mk.laden().catch(() => {}) // Collection fehlt noch → Postfach geht trotzdem
}

// Gemerkte Liste sofort zeigen, im Hintergrund nachschauen; danach jede Minute
onMounted(() => {
  post.aktualisieren(listenOrdner.value)
  markierungenLaden()
})
watch(reiter, () => {
  offen.value = null
  entwurf.value = null
  post.aktualisieren(listenOrdner.value)
})
// alle 3 Minuten (jede Abfrage kostet Netlify-Rechenzeit); sofort geht's über „Aktualisieren“
useAutoAktualisierung(() => Promise.all([post.aktualisieren(listenOrdner.value), markierungenLaden()]), 3 * 60_000)

async function frischHolen() {
  await Promise.all([post.aktualisieren(listenOrdner.value, true), markierungenLaden()])
  if (!post.fehler.value) zeige('Postfach ist aktuell.')
}

// „vor 2 Min. aktualisiert“ – tickt mit
const jetzt = ref(Date.now())
useAutoAktualisierung(() => (jetzt.value = Date.now()), 15_000)
const aktualisiertText = computed(() => {
  if (!data.value) return ''
  const s = Math.round((jetzt.value - data.value.um) / 1000)
  const min = Math.floor(s / 60)
  return min < 1 ? 'gerade aktualisiert' : `vor ${min} ${min === 1 ? 'Minute' : 'Minuten'} aktualisiert`
})

// ---------- Markierungen ----------
const fuerMich = computed(() => (mk.markierungen.value ?? []).filter(m => m.fuer?.id === ich.value?.id))
const reiterListe = computed(() => [
  { key: 'eingang', text: 'Eingang' },
  { key: 'gesendet', text: 'Gesendet' },
  { key: 'fuermich', text: 'Für mich', anzahl: fuerMich.value.length },
])
const markiertFuerMich = (messageId: string | null) => mk.zurMail(messageId).some(m => m.fuer?.id === ich.value?.id)
const vorname = (p: PostPerson | null) => (p?.id === ich.value?.id ? 'dich' : p?.first_name || personName(p))

const markierenOffen = ref(false)
const markierung = reactive({ fuer: '', notiz: '' })
const markiert = ref(false)
async function markierenStarten() {
  markierenOffen.value = !markierenOffen.value
  if (markierenOffen.value) await mk.personenLaden().catch(fehler)
}
async function markierenSpeichern() {
  if (!offen.value || !markierung.fuer) return
  markiert.value = true
  try {
    await mk.markieren(offen.value, offenOrdner.value, markierung.fuer, markierung.notiz)
    const p = mk.personen.value?.find(x => x.id === markierung.fuer)
    zeige(`Für ${p?.id === ich.value?.id ? 'dich' : personName(p)} markiert.`)
    markierenOffen.value = false
    Object.assign(markierung, { fuer: '', notiz: '' })
  }
  catch (e) {
    fehler(e)
  }
  markiert.value = false
}
async function erledigen(m: PostMarkierung) {
  try {
    await mk.erledigen(m.id)
    zeige('Markierung erledigt.')
  }
  catch (e) {
    fehler(e)
  }
}

// ---------- Lesen ----------
const offen = ref<PostMail | null>(null)
const offenOrdner = ref<PostOrdner>('eingang')
const laedt = ref<number | null>(null)
const offenMarkierungen = computed(() => mk.zurMail(offen.value?.messageId))

async function oeffnen(ordner: PostOrdner, uid: number) {
  entwurf.value = null
  markierenOffen.value = false
  const r = reiter.value
  laedt.value = uid
  try {
    const mail = await post.mail(ordner, uid)
    if (r === reiter.value) {
      offen.value = mail
      offenOrdner.value = ordner
    }
  }
  catch (e) {
    fehler(e)
  }
  laedt.value = null
}

async function markierungOeffnen(m: PostMarkierung) {
  if (!m.uid) return zeige('Diese Mail lässt sich hier nicht öffnen – bitte im Webmail suchen.', 'fehler')
  await oeffnen(m.ordner, m.uid)
}

// ---------- Schreiben ----------
interface Entwurf { an: string, cc: string, betreff: string, text: string, antwortAuf?: number }
const entwurf = ref<Entwurf | null>(null)
// Text beim Öffnen – nur wer etwas geändert hat, wird beim Verwerfen gefragt
let entwurfAnfang = ''
const sendet = ref(false)

const gruss = computed(() => `\n\nViele Grüße\n${ich.value?.first_name ?? ''}\nfür Königsdorf rückt zusammen e.V.\n${verein.value.kontakt_email}`)

function neueMail() {
  offen.value = null
  entwurf.value = { an: '', cc: '', betreff: '', text: gruss.value }
  entwurfAnfang = gruss.value
}

/** gibt es außer dem Absender noch andere Empfänger? */
const mehrere = (m: PostMail) => m.weitereAn.length + m.weitereCc.length > 0

/**
 * Antworten wie im Mailprogramm. `alle`: Absender + übrige An-Empfänger in „An“, Kopie bleibt Kopie.
 * Aus „Gesendet“ geht es an dieselben Leute wie damals („Nochmal schreiben“).
 */
function antworten(m: PostMail, alle = false) {
  const zitat = m.text.split('\n').slice(0, 60).map(z => `> ${z}`).join('\n')
  const gesendet = offenOrdner.value === 'gesendet'
  const an = gesendet ? m.anAdressen : alle ? [m.vonAdresse, ...m.weitereAn] : [m.vonAdresse]
  const cc = gesendet ? m.ccAdressen : alle ? m.weitereCc : []
  entwurf.value = {
    an: an.join(', '),
    cc: cc.join(', '),
    betreff: /^(re|aw):/i.test(m.betreff) ? m.betreff : `Re: ${m.betreff}`,
    text: gesendet
      ? `Hallo,\n\n${gruss.value}\n\nAm ${datumLang(m.datum)} schrieben wir:\n${zitat}`
      : `Hallo ${m.von.split(' ')[0]},\n\n${gruss.value}\n\nAm ${datumLang(m.datum)} schrieb ${m.von}:\n${zitat}`,
    antwortAuf: gesendet ? undefined : m.uid,
  }
  entwurfAnfang = entwurf.value.text
}

function weiterleiten(m: PostMail) {
  const kopf = [`Von: ${m.von} <${m.vonAdresse}>`, `Datum: ${datumLang(m.datum)}, ${uhrzeit(m.datum)} Uhr`, `Betreff: ${m.betreff}`, `An: ${m.an}`, ...(m.cc ? [`Kopie: ${m.cc}`] : [])].join('\n')
  const anhaenge = m.anhaenge.length ? `\n\n(Anhänge nicht mit weitergeleitet: ${m.anhaenge.map(a => a.name).join(', ')} – dafür das Webmail nehmen)` : ''
  entwurf.value = {
    an: '',
    cc: '',
    betreff: /^(fwd?|wg):/i.test(m.betreff) ? m.betreff : `Fwd: ${m.betreff}`,
    text: `${gruss.value}\n\n---------- Weitergeleitete Nachricht ----------\n${kopf}\n\n${m.text}${anhaenge}`,
  }
  entwurfAnfang = entwurf.value.text
}

async function senden() {
  if (!entwurf.value) return
  sendet.value = true
  try {
    const cc = entwurf.value.cc.split(/[,;\s]+/).filter(Boolean)
    const r = await $fetch<{ weg: 'postfach' | 'brevo' }>('/api/vereinsheim/post/senden', { method: 'POST', body: { ...entwurf.value, cc } })
    zeige(r.weg === 'postfach' ? 'Ab in die Post!' : 'Ab in die Post! (über Brevo verschickt)')
    if (offen.value && entwurf.value.antwortAuf) offen.value = { ...offen.value, beantwortet: true }
    entwurf.value = null
    post.vergessen()
    await post.aktualisieren(listenOrdner.value, true)
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

const loescht = ref(false)
async function loeschen(m: PostMail) {
  if (!window.confirm(`„${m.betreff}“ in den Papierkorb legen?`)) return
  loescht.value = true
  try {
    const r = await post.loeschen(offenOrdner.value, m.uid)
    // Markierungen der Mail gleich mit abhaken
    await Promise.all(mk.zurMail(m.messageId).map(x => mk.erledigen(x.id).catch(() => {})))
    if (offen.value?.uid === m.uid) offen.value = null
    zeige(r.papierkorb ? 'Liegt im Papierkorb (im Webmail zurückholbar).' : 'Gelöscht.')
  }
  catch (e) {
    fehler(e)
  }
  loescht.value = false
}

function verwerfen() {
  if (entwurf.value && entwurf.value.text.trim() !== entwurfAnfang.trim() && !window.confirm('Entwurf wegwerfen?')) return
  entwurf.value = null
}

// ---------- Handy: Liste und Mail nacheinander statt untereinander ----------
const raster = ref<HTMLElement | null>(null)
const schmal = () => window.matchMedia('(max-width: 760px)').matches
// beim Öffnen einer Mail / eines Entwurfs nach oben, damit man nicht unter dem Verlauf landet
watch(() => [offen.value?.uid, !!entwurf.value], async () => {
  if (!import.meta.client || !schmal() || (!offen.value && !entwurf.value)) return
  await nextTick()
  const oben = raster.value?.getBoundingClientRect().top ?? 0
  if (oben < 0 || oben > window.innerHeight / 2) window.scrollTo({ top: window.scrollY + oben - 16, behavior: 'instant' })
})

function zurueck() {
  if (entwurf.value) return verwerfen()
  offen.value = null
}

// ---------- Rechtsklick-Menü an den Mails ----------
const kontext = ref<{ x: number, y: number, ordner: PostOrdner, uid: number, gelesen: boolean | null, markierung: PostMarkierung | null } | null>(null)

function kontextOeffnen(e: MouseEvent, ordner: PostOrdner, uid: number | null, gelesen: boolean | null, markierung: PostMarkierung | null = null) {
  if (!uid) return
  e.preventDefault()
  // Tastatur (Kontextmenü-Taste/Umschalt+F10): am Eintrag statt an der Mausposition
  const ort = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : (() => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return { x: r.left + 24, y: r.bottom - 8 }
  })()
  kontext.value = { ...ort, ordner, uid, gelesen, markierung }
  post.vorladen(ordner, uid)
}

/** Mail öffnen und dann `tun` mit ihr */
async function mitMail(ordner: PostOrdner, uid: number, tun: (m: PostMail) => unknown) {
  await oeffnen(ordner, uid)
  if (offen.value?.uid === uid && offenOrdner.value === ordner) await tun(offen.value)
}

const kontextGruppen = computed<KontextEintrag[][]>(() => {
  const k = kontext.value
  if (!k) return []
  const { ordner, uid } = k
  const eingang = ordner === 'eingang'
  return [
    [
      { text: eingang ? 'Antworten' : 'Nochmal schreiben', aktion: () => mitMail(ordner, uid, m => antworten(m)) },
      ...(eingang ? [{ text: 'Allen antworten', aktion: () => mitMail(ordner, uid, m => antworten(m, true)) }] : []),
      { text: 'Weiterleiten', aktion: () => mitMail(ordner, uid, weiterleiten) },
    ],
    [
      { text: '📌 Markieren für …', aktion: () => mitMail(ordner, uid, () => markierenStarten()) },
      ...(k.markierung ? [{ text: 'Markierung erledigt ✓', aktion: () => erledigen(k.markierung!) }] : []),
      ...(eingang && k.gelesen !== null
        ? [{ text: k.gelesen ? 'Als ungelesen markieren' : 'Als gelesen markieren', aktion: () => post.gelesen(ordner, uid, !k.gelesen).catch(fehler) }]
        : []),
    ],
    [
      { text: 'Löschen', gefahr: true, aktion: () => mitMail(ordner, uid, loeschen) },
    ],
  ]
})

// Punktemenü über der Mail
const mehr = ref<{ x: number, y: number } | null>(null)
function mehrOeffnen(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mehr.value = mehr.value ? null : { x: r.right - 220, y: r.bottom + 6 }
}
const mehrGruppen = computed<KontextEintrag[][]>(() => {
  const m = offen.value
  if (!m) return []
  const eingang = offenOrdner.value === 'eingang'
  const kopf = data.value?.mails.find(x => x.uid === m.uid)
  return [
    [
      ...(eingang && mehrere(m) ? [{ text: `Nur ${m.von.split(' ')[0]} antworten`, aktion: () => antworten(m) }] : []),
      { text: 'Weiterleiten', aktion: () => weiterleiten(m) },
    ],
    eingang && kopf
      ? [{ text: kopf.gelesen ? 'Als ungelesen markieren' : 'Als gelesen markieren', aktion: () => post.gelesen('eingang', m.uid, !kopf.gelesen).then(() => zeige(kopf.gelesen ? 'Als ungelesen markiert.' : 'Als gelesen markiert.'), fehler) }]
      : [],
  ]
})

function datumKurz(iso: string) {
  return `${datumLang(iso)} ${uhrzeit(iso)}`
}

function wann(iso: string) {
  return Date.now() - Date.parse(iso) < 86_400_000 ? uhrzeit(iso) : tagMonat(iso)
}

const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`)
</script>

<template>
  <div class="post">
    <VereinsheimKopf titel="Die" hervorhebung="Post">
      <template #meta>
        Kontakt-Postfach.<template v-if="data?.webmail"> Zum Webmail <a :href="data.webmail" target="_blank" rel="noopener" class="post__webmail">hier entlang</a>.</template>
      </template>
      <BasisKnopf v-if="data?.eingerichtet" variante="outline" groesse="klein" :disabled="laedtListe" @click="frischHolen">{{ laedtListe ? 'Schaut nach …' : 'Aktualisieren' }}</BasisKnopf>
      <BasisKnopf v-if="data?.eingerichtet" groesse="klein" @click="neueMail">+ Neue Mail</BasisKnopf>
      <BasisKnopf to="/vereinsheim/post/rundbrief" groesse="klein">+ Neuer Rundbrief</BasisKnopf>
    </VereinsheimKopf>

    <div v-if="data && !data.eingerichtet" class="vh-karte post__fehlt">
      <h2>Noch kein Postfach angeschlossen</h2>
      <p>Sobald die Zugangsdaten des Postfachs auf Netlify stehen (<code>NUXT_IMAP_HOST</code>, <code>NUXT_IMAP_BENUTZER</code>, <code>NUXT_IMAP_PASSWORT</code>), liegt die Post hier.</p>
    </div>

    <template v-else>
      <div class="post__leiste">
        <VereinsheimReiter v-model="reiter" :reiter="reiterListe" />
        <p class="post__stand" aria-live="polite">{{ laedtListe && data ? 'schaut nach neuer Post …' : aktualisiertText }}</p>
      </div>

      <div ref="raster" class="post__raster" :class="{ 'post__raster--detail': offen || entwurf }">
        <!-- Für mich: Markierungen statt Ordnerliste -->
        <ul v-if="reiter === 'fuermich'" class="post__liste vh-karte" aria-label="Für mich markiert">
          <li v-if="!mk.markierungen.value" class="post__hinweis">Wird geholt …</li>
          <li v-else-if="!fuerMich.length" class="post__hinweis">Nichts für dich markiert. Gönn dir einen Kaffee.</li>
          <li v-for="m in fuerMich" :key="m.id">
            <button
              type="button"
              class="brief brief--fuer-mich"
              :class="{ 'brief--offen': offen?.messageId === m.message_id }"
              :aria-pressed="offen?.messageId === m.message_id"
              @click="markierungOeffnen(m)"
              @contextmenu="kontextOeffnen($event, m.ordner, m.uid, null, m)"
            >
              <span class="brief__von">{{ m.von }}</span>
              <span class="brief__zeit">{{ laedt === m.uid ? '…' : m.datum ? wann(m.datum) : '' }}</span>
              <span class="brief__betreff">{{ m.betreff }}</span>
              <span class="brief__markierung">📌 von {{ personName(m.user_created) }}{{ m.notiz ? `: „${m.notiz}“` : '' }}</span>
            </button>
          </li>
        </ul>

        <ul v-else class="post__liste vh-karte" :aria-label="reiter === 'eingang' ? 'Eingang' : 'Gesendet'">
          <li v-if="!data && laedtListe" class="post__hinweis">Post wird geholt …</li>
          <li v-else-if="!data && post.fehler.value" class="post__hinweis" role="alert">{{ post.fehler.value }}</li>
          <li v-else-if="data && !data.mails.length" class="post__hinweis">{{ reiter === 'eingang' ? 'Der Briefkasten ist leer.' : 'Noch nichts verschickt.' }}</li>
          <li v-for="m in data?.mails ?? []" :key="m.uid">
            <button
              type="button"
              class="brief"
              :class="{ 'brief--neu': !m.gelesen && reiter === 'eingang', 'brief--offen': offen?.uid === m.uid && offenOrdner === listenOrdner, 'brief--fuer-mich': markiertFuerMich(m.messageId) }"
              :aria-pressed="offen?.uid === m.uid && offenOrdner === listenOrdner"
              @pointerenter="post.vorladen(listenOrdner, m.uid)"
              @focus="post.vorladen(listenOrdner, m.uid)"
              @click="oeffnen(listenOrdner, m.uid)"
              @contextmenu="kontextOeffnen($event, listenOrdner, m.uid, m.gelesen, mk.zurMail(m.messageId).find(x => x.fuer?.id === ich?.id) ?? null)"
            >
              <span class="brief__von">
                <span v-if="m.beantwortet" class="brief__beantwortet" title="beantwortet">↩</span>
                {{ reiter === 'eingang' ? m.von : `an ${m.an}${m.cc ? ` · Kopie ${m.cc}` : ''}` }}
              </span>
              <span class="brief__zeit">{{ laedt === m.uid ? '…' : wann(m.datum) }}</span>
              <span class="brief__betreff">{{ m.betreff }}</span>
              <span v-if="mk.zurMail(m.messageId).length" class="brief__markierung">
                📌 für {{ mk.zurMail(m.messageId).map(x => vorname(x.fuer)).join(', ') }}
              </span>
            </button>
          </li>
        </ul>

        <div class="post__rechts">
          <!-- nur auf dem Handy: Liste ist ausgeblendet, solange eine Mail oder ein Entwurf offen ist -->
          <button v-if="offen || entwurf" type="button" class="post__zurueck" @click="zurueck">
            ← {{ entwurf && offen ? 'Zurück zur Mail' : 'Zurück zur Liste' }}
          </button>
          <!-- Schreiben -->
          <form v-if="entwurf" class="schreiben" @submit.prevent="senden">
            <p class="schreiben__titel">{{ entwurf.antwortAuf ? 'Antwort' : /^fwd?:/i.test(entwurf.betreff) ? 'Weiterleiten' : 'Neue Mail' }}</p>
            <p class="schreiben__von">von <strong>{{ verein.kontakt_email }}</strong></p>
            <BasisFeld v-model="entwurf.an" label="An" name="an" required hinweis="mehrere Adressen mit Komma trennen" />
            <BasisFeld v-model="entwurf.cc" label="Kopie an" name="cc" />
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
              <div class="post__kopfzeile">
                <p class="post__absender">
                  <strong>{{ offen.von }}</strong> &lt;{{ offen.vonAdresse }}&gt;<br>
                  <span class="post__an"><strong>An</strong> {{ offen.an }}</span>
                  <template v-if="offen.cc"><br><span class="post__an"><strong>Kopie</strong> {{ offen.cc }}</span></template>
                  <span v-if="offen.beantwortet" class="post__beantwortet"> · beantwortet</span>
                </p>
                <div class="post__rechtsoben">
                  <span class="post__datum">{{ datumKurz(offen.datum) }}</span>
                  <div class="post__aktionen" role="toolbar" aria-label="Mail bearbeiten">
                    <VereinsheimSymbolKnopf symbol="loeschen" tipp="Löschen" :disabled="loescht" @click="loeschen(offen)" />
                    <VereinsheimSymbolKnopf
                      v-if="offenOrdner === 'eingang' && mehrere(offen)"
                      symbol="alle"
                      tipp="Allen antworten"
                      @click="antworten(offen, true)"
                    />
                    <VereinsheimSymbolKnopf v-else symbol="antworten" :tipp="offenOrdner === 'eingang' ? 'Antworten' : 'Nochmal schreiben'" @click="antworten(offen)" />
                    <VereinsheimSymbolKnopf v-if="offen.messageId" symbol="markieren" tipp="Markieren für …" :aria-expanded="markierenOffen" @click="markierenStarten" />
                    <VereinsheimSymbolKnopf symbol="mehr" tipp="Mehr" rechts aria-haspopup="menu" :aria-expanded="!!mehr" @click="mehrOeffnen" />
                  </div>
                </div>
              </div>
              <form v-if="markierenOffen" class="markieren" @submit.prevent="markierenSpeichern">
                <label class="markieren__feld">
                  <span class="vh-label">Für wen?</span>
                  <select v-model="markierung.fuer" required>
                    <option value="" disabled>{{ mk.personen.value ? '– bitte wählen –' : 'lädt …' }}</option>
                    <option v-for="p in mk.personen.value ?? []" :key="p.id" :value="p.id">{{ personName(p) }}{{ p.id === ich?.id ? ' (ich)' : '' }}</option>
                  </select>
                </label>
                <label class="markieren__feld markieren__feld--breit">
                  <span class="vh-label">Hinweis (optional)</span>
                  <input v-model="markierung.notiz" type="text" maxlength="300" placeholder="z.B. Kannst du das übernehmen?">
                </label>
                <BasisKnopf type="submit" groesse="klein" :disabled="markiert || !markierung.fuer">{{ markiert ? 'Markiert …' : 'Markieren' }}</BasisKnopf>
              </form>

              <ul v-if="offenMarkierungen.length" class="post__markierungen">
                <li v-for="m in offenMarkierungen" :key="m.id" :class="{ 'post__markierung--ich': m.fuer?.id === ich?.id }">
                  📌 <strong>für {{ m.fuer?.id === ich?.id ? 'dich' : personName(m.fuer) }}</strong>
                  · markiert von {{ m.user_created?.id === ich?.id ? 'dir' : personName(m.user_created) }}, {{ tagMonat(m.date_created) }}
                  <template v-if="m.notiz">· „{{ m.notiz }}“</template>
                  <button type="button" class="post__erledigt" @click="erledigen(m)">erledigt ✓</button>
                </li>
              </ul>

            </header>
            <div class="post__text">{{ offen.text || '(kein Text)' }}</div>
            <p v-if="offen.anhaenge.length" class="post__anhaenge">
              📎 {{ offen.anhaenge.map(a => `${a.name} (${kb(a.groesse)})`).join(' · ') }} –
              <a v-if="data?.webmail" :href="data.webmail" target="_blank" rel="noopener">Anhänge im Webmail öffnen</a>
              <template v-else>Anhänge im Webmail öffnen</template>
            </p>
          </article>

          <p v-else class="post__hinweis">Mail links auswählen oder eine neue schreiben.</p>
        </div>
      </div>
    </template>

    <VereinsheimKontextmenue v-if="mehr" :x="mehr.x" :y="mehr.y" :gruppen="mehrGruppen" label="Mehr" @schliessen="mehr = null" />
    <VereinsheimKontextmenue v-if="kontext" :key="`${kontext.x}-${kontext.y}-${kontext.uid}`" :x="kontext.x" :y="kontext.y" :gruppen="kontextGruppen" label="Mail" @schliessen="kontext = null" />
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

.post__webmail {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.post__zurueck {
  display: none;
  margin-bottom: var(--abstand-s);
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  font-weight: var(--gewicht-text-fett);
  cursor: pointer;
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

.brief--fuer-mich {
  background: #efe9fc;
  box-shadow: inset 4px 0 0 var(--farbe-flieder);
}

.brief--fuer-mich:hover,
.brief--fuer-mich.brief--offen {
  background: var(--farbe-pfirsich);
}

.brief--fuer-mich.brief--offen {
  box-shadow: inset 4px 0 0 var(--farbe-lila);
}

.brief__markierung {
  grid-column: 1 / -1;
  overflow: hidden;
  color: var(--farbe-lila);
  font-size: var(--groesse-xs);
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

.post__kopfzeile {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--abstand-xs) var(--abstand-m);
  margin-bottom: var(--abstand-s);
}

.post__absender {
  min-width: 0;
  overflow-wrap: anywhere;
}

.post__rechtsoben {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  margin-left: auto;
}

.post__datum {
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}

.post__aktionen {
  display: flex;
  gap: 0.1rem;
  margin-right: -0.5rem;
}

.markieren {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--abstand-xs) var(--abstand-s);
  margin-bottom: var(--abstand-m);
  padding: var(--abstand-s);
  border-radius: 0.6rem;
  background: #efe9fc;
}

.markieren__feld {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.markieren__feld--breit {
  flex: 1 1 14rem;
}

.markieren select,
.markieren input {
  padding: 0.45rem 0.6rem;
  border: 1.5px solid var(--vh-rand-stark);
  border-radius: 0.5rem;
  background: var(--farbe-weiss);
  font: inherit;
  font-size: var(--groesse-s);
}

.post__markierungen {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 var(--abstand-m);
  padding: 0;
  list-style: none;
  font-size: var(--groesse-xs);
}

.post__markierungen li {
  padding: 0.45rem 0.7rem;
  border-radius: 0.5rem;
  background: var(--farbe-pfirsich);
}

.post__markierungen .post__markierung--ich {
  background: #efe9fc;
  box-shadow: inset 4px 0 0 var(--farbe-flieder);
}

.post__erledigt {
  margin-left: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
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

  /* Mail oder Entwurf offen: nur das zeigen, Liste über „Zurück“ */
  .post__raster--detail .post__liste {
    display: none;
  }

  .post__zurueck {
    display: inline-block;
  }

  .post__raster:not(.post__raster--detail) .post__rechts {
    display: none;
  }
}
</style>
