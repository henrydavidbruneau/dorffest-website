<script setup lang="ts">
// Kontakt-Postfach (nur Vorstand): Liste links, Mail rechts. Nur lesen – antworten im Webmail
// oder per „Antworten“ im eigenen Mailprogramm.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Post · Vereinsheim', robots: 'noindex, nofollow' })

interface MailKopf { uid: number, von: string, vonAdresse: string, betreff: string, datum: string, gelesen: boolean }
interface Mail extends MailKopf { an: string, text: string, anhaenge: { name: string, groesse: number }[] }

const { fehler } = useVereinsheimMeldung()
const verein = useVerein()
const { data, status, refresh } = useAsyncData('vh-post', () => $fetch<{ eingerichtet: boolean, webmail: string, mails: MailKopf[] }>('/api/vereinsheim/post'), { server: false })
const offen = ref<Mail | null>(null)
const laedt = ref<number | null>(null)

async function oeffnen(m: MailKopf) {
  laedt.value = m.uid
  try {
    offen.value = await $fetch<Mail>(`/api/vereinsheim/post/${m.uid}`)
  }
  catch (e) {
    fehler(e)
  }
  laedt.value = null
}

const antwortLink = computed(() => offen.value
  ? `mailto:${offen.value.vonAdresse}?subject=${encodeURIComponent(offen.value.betreff.startsWith('Re:') ? offen.value.betreff : `Re: ${offen.value.betreff}`)}`
  : '')

function wann(iso: string) {
  const d = new Date(iso)
  return Date.now() - d.getTime() < 86_400_000 ? uhrzeit(iso) : tagMonat(iso)
}

const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`)
</script>

<template>
  <div class="post">
    <VereinsheimKopf titel="Post" :zusatz="verein.kontakt_email">
      <BasisKnopf v-if="data?.eingerichtet" variante="outline" groesse="klein" @click="refresh()">Briefkasten leeren</BasisKnopf>
      <BasisKnopf v-if="data?.webmail" :to="data.webmail" target="_blank" groesse="klein">Zum Webmail ↗</BasisKnopf>
    </VereinsheimKopf>

    <p v-if="status === 'pending'" class="handschrift post__laedt">Schaue in den Briefkasten …</p>

    <BasisNotizzettel v-else-if="!data?.eingerichtet" farbe="pfirsich" tape="mitte" :drehung="-0.5" class="post__fehlt">
      <h2>Noch kein Postfach angeschlossen</h2>
      <p>Sobald es für {{ verein.kontakt_email }} ein echtes Postfach gibt und die Zugangsdaten auf Netlify stehen (<code>NUXT_IMAP_HOST</code>, <code>NUXT_IMAP_BENUTZER</code>, <code>NUXT_IMAP_PASSWORT</code>), liegt die Post hier.</p>
    </BasisNotizzettel>

    <div v-else class="post__raster">
      <ul class="post__liste" aria-label="Eingang">
        <li v-if="!data.mails.length" class="handschrift post__leer">Der Briefkasten ist leer.</li>
        <li v-for="m in data.mails" :key="m.uid">
          <button type="button" class="brief" :class="{ 'brief--neu': !m.gelesen, 'brief--offen': offen?.uid === m.uid }" :aria-pressed="offen?.uid === m.uid" @click="oeffnen(m)">
            <span class="brief__von">{{ m.von }}</span>
            <span class="brief__zeit">{{ laedt === m.uid ? '…' : wann(m.datum) }}</span>
            <span class="brief__betreff">{{ m.betreff }}</span>
          </button>
        </li>
      </ul>

      <article v-if="offen" class="post__mail" aria-live="polite">
        <header class="post__kopf">
          <h2>{{ offen.betreff }}</h2>
          <p><strong>{{ offen.von }}</strong> &lt;{{ offen.vonAdresse }}&gt;<br>an {{ offen.an }} · {{ datumAusgeschrieben(offen.datum) }}, {{ uhrzeit(offen.datum) }} Uhr</p>
        </header>
        <div class="post__text">{{ offen.text || '(kein Text)' }}</div>
        <p v-if="offen.anhaenge.length" class="post__anhaenge">
          📎 {{ offen.anhaenge.map(a => `${a.name} (${kb(a.groesse)})`).join(' · ') }} – Anhänge im Webmail öffnen
        </p>
        <div class="post__aktionen">
          <BasisKnopf :to="antwortLink" groesse="klein">Antworten</BasisKnopf>
          <span class="post__tipp">öffnet dein Mailprogramm – bitte als {{ verein.kontakt_email }} antworten oder im Webmail</span>
        </div>
      </article>
      <p v-else class="handschrift post__waehlen">← Brief aussuchen</p>
    </div>
  </div>
</template>

<style scoped>
.post {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.post__laedt,
.post__waehlen,
.post__leer {
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
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

.brief:hover {
  background: var(--farbe-pfirsich);
}

.brief--offen {
  background: var(--farbe-pfirsich);
  box-shadow: inset 4px 0 0 var(--farbe-orange);
}

.brief__von {
  overflow: hidden;
  font-size: var(--groesse-s);
  text-overflow: ellipsis;
  white-space: nowrap;
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

.post__mail {
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s);
  margin-top: var(--abstand-l);
}

.post__tipp {
  font-size: var(--groesse-xs);
}

@media (max-width: 760px) {
  .post__raster {
    grid-template-columns: 1fr;
  }
}
</style>
