<script setup lang="ts">
// „Rundmail an Vereine“: Einladung zu einem Termin an den Verteiler Zivilgesellschaft
// (Diverses → Verteiler). Schlichte Textmail mit gemeinsamer Anrede, mit den Termindaten vorbefüllt.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Rundmail an Vereine · Vereinsheim', robots: 'noindex, nofollow' })

interface Termin {
  id: number, slug: string, status: string, titel: string, beginn: string | null, ende: string | null, uhrzeit_folgt: boolean | null
  datum_text: string | null, ort: string | null, adresse: string | null, kurzbeschreibung: string | null, wiederholung?: string | null, wiederholung_bis?: string | null
}
interface Protokoll extends VerteilerMail { user_created: { first_name: string | null } | null }

const route = useRoute()
const id = Number(route.params.id)
const { zeige, fehler } = useVereinsheimMeldung()

const { data, refresh } = useAsyncData(`vh-verteiler-${id}`, async () => {
  const [termin, kontakte, mails] = await Promise.all([
    vh.eins<Termin>('termine', id, { fields: '*' }),
    vh.liste<VerteilerKontakt>('verteiler', { fields: 'id,organisation,ansprechperson,email', filter: { aktiv: { _eq: true } }, sort: 'organisation' }),
    vh.liste<Protokoll>('verteiler_mails', { fields: 'id,betreff,empfaenger_anzahl,gesendet_am,user_created.first_name', filter: { termin: { _eq: id } }, sort: '-gesendet_am' }),
  ])
  return { termin, kontakte, mails }
}, { server: false })

const kontakte = computed(() => data.value?.kontakte ?? [])
// jede Adresse nur einmal (wie beim Versand)
const empfaengerAnzahl = computed(() => new Set(kontakte.value.map(k => k.email.trim().toLowerCase())).size)

// regelmäßige Termine: nächstes Datum + Rhythmus
const termin = computed(() => {
  const t = data.value?.termin
  if (!t) return null
  const regelmaessig = !!t.wiederholung && t.wiederholung !== 'aus'
  const naechstes = regelmaessig ? naechstesVorkommen(t) : null
  return { ...t, beginn: naechstes?.beginn ?? t.beginn, rhythmus: regelmaessig ? wiederholungText(t.wiederholung, t.beginn) : '' }
})

const websiteLink = computed(() => (termin.value ? `${new URL(useRuntimeConfig().public.siteUrl).origin}/termine/${termin.value.slug}` : ''))

function vorschlag(t: NonNullable<typeof termin.value>) {
  const wann = t.beginn
    ? `${datumAusgeschrieben(t.beginn)}${t.uhrzeit_folgt ? ' (Uhrzeit folgt)' : `, ${uhrzeit(t.beginn)} Uhr`}`
    : (t.datum_text || 'Datum folgt')
  const wo = [t.ort, t.adresse].filter(Boolean).join(', ')
  return [
    'Liebe Vereine, Initiativen und Engagierte in Königsdorf,',
    'wir vom Verein „Königsdorf rückt zusammen“ laden euch herzlich ein – und freuen uns, wenn ihr die Einladung in euren Gruppen weitersagt:',
    `${t.titel}\n${wann}${t.rhythmus ? ` · ${t.rhythmus}` : ''}${wo ? `\n${wo}` : ''}`,
    ...(t.kurzbeschreibung ? [t.kurzbeschreibung.trim()] : []),
    `Alles zum Termin: ${websiteLink.value}`,
    'Wir freuen uns auf euch!',
  ].join('\n\n')
}

const mail = reactive({ betreff: '', text: '' })
watch(termin, (t) => {
  if (!t) return
  if (!mail.betreff) mail.betreff = `Einladung: ${t.titel}`
  if (!mail.text) mail.text = vorschlag(t)
}, { immediate: true })
function zuruecksetzen() {
  if (!termin.value || !window.confirm('Text wieder auf den Vorschlag zurücksetzen?')) return
  mail.betreff = `Einladung: ${termin.value.titel}`
  mail.text = vorschlag(termin.value)
}

// Vorschau: genau der Text, der ankommt (schlichte Textmail, unser Gruß darunter)
const vorschauAn = computed(() => kontakte.value[0] ?? null)
const vorschauText = computed(() => mailText([mail.text.trim() || '…', GRUSS].join('\n\n')))

const sendet = ref(false)
async function senden() {
  if (!window.confirm(`Einladung an ${empfaengerAnzahl.value} Vereine und Gruppen schicken?`)) return
  sendet.value = true
  try {
    const r = await $fetch<{ gesendet: number }>(`/api/vereinsheim/termine/${id}/verteiler-mail`, { method: 'POST', body: { ...mail } })
    zeige(`Ab in die Post: ${r.gesendet} Mails verschickt.`)
    await refresh()
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}
</script>

<template>
  <div class="vm">
    <VereinsheimKopf :titel="data?.termin.titel ?? 'Rundmail an Vereine'" zusatz="Rundmail an Vereine · Verteiler Zivilgesellschaft" :zurueck="{ to: '/vereinsheim/termine', text: 'Zu den Terminen' }">
      <BasisKnopf variante="outline" groesse="klein" to="/vereinsheim/verteiler">Verteiler bearbeiten</BasisKnopf>
    </VereinsheimKopf>

    <p v-if="!data" class="vh-leer">Wird geladen …</p>
    <template v-else>
      <p v-if="data?.termin.status !== 'published'" class="vm__warnung vh-karte">
        Der Termin ist noch nicht veröffentlicht – der Link in der Mail führt dann ins Leere. Erst veröffentlichen, dann einladen.
      </p>

      <div v-if="!kontakte.length" class="vh-karte vm__leer">
        <p>Im Verteiler steht noch niemand (oder alle sind pausiert).</p>
        <BasisKnopf groesse="klein" to="/vereinsheim/verteiler">Vereine eintragen</BasisKnopf>
      </div>

      <div v-else class="vh-karte">
        <p class="vm__info">
          Geht als schlichte Textmail an <strong>{{ empfaengerAnzahl }} Adressen</strong> – alle bekommen denselben Text mit unserem Gruß darunter, aber jede einzeln, damit niemand die anderen Adressen sieht.
        </p>
        <details class="vm__wer">
          <summary>Wer bekommt die Mail?</summary>
          <ul>
            <li v-for="k in kontakte" :key="k.id">{{ k.organisation }}<span v-if="k.ansprechperson"> ({{ k.ansprechperson }})</span> · {{ k.email }}</li>
          </ul>
        </details>

        <form class="vm__form" @submit.prevent="senden">
          <BasisFeld v-model="mail.betreff" label="Betreff" name="betreff" required :maxlength="200" />
          <BasisFeld v-model="mail.text" label="Text" name="text" required mehrzeilig :zeilen="12" hinweis="Reiner Text, ohne Formatierung. Links einfach als Adresse hineinschreiben." />
          <button type="button" class="vm__zurueck" @click="zuruecksetzen">Text auf den Vorschlag zurücksetzen</button>

          <div class="vm__vorschau" aria-live="polite">
            <p class="vm__vorschau-titel">Vorschau</p>
            <dl class="vm__vorschau-kopf">
              <dt>An</dt><dd>{{ vorschauAn?.organisation }}{{ empfaengerAnzahl > 1 ? ` (und ${empfaengerAnzahl - 1} weitere, jede*r einzeln)` : '' }}</dd>
              <dt>Betreff</dt><dd>{{ mail.betreff || '…' }}</dd>
            </dl>
            <pre class="vm__vorschau-mail">{{ vorschauText }}</pre>
          </div>
          <BasisKnopf type="submit" :disabled="sendet || !empfaengerAnzahl">{{ sendet ? 'Wird gesendet …' : `An ${empfaengerAnzahl} schicken` }}</BasisKnopf>
        </form>
      </div>

      <div v-if="data?.mails.length" class="vh-karte vm__protokoll">
        <h2>Schon eingeladen</h2>
        <ul>
          <li v-for="m in data?.mails" :key="m.id">
            „{{ m.betreff }}“ – {{ m.gesendet_am ? datumLang(m.gesendet_am) : '' }} an {{ m.empfaenger_anzahl }}{{ m.user_created?.first_name ? `, von ${m.user_created.first_name}` : '' }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vm {
  display: grid;
  gap: var(--abstand-m);
  max-width: 62rem;
  margin-inline: auto;
}

.vm__warnung {
  margin: 0;
  border-left: 6px solid var(--farbe-orange);
}

.vm__leer {
  display: grid;
  justify-items: start;
  gap: var(--abstand-s);
}

.vm__leer p,
.vm__info {
  margin: 0;
}

.vm__wer {
  margin: var(--abstand-xs) 0 var(--abstand-m);
  font-size: var(--groesse-s);
}

.vm__wer summary {
  cursor: pointer;
  color: var(--farbe-lila);
}

.vm__wer ul {
  margin: var(--abstand-xs) 0 0;
  padding-left: 1.2rem;
  overflow-wrap: anywhere;
}

.vm__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.vm__zurueck {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--groesse-xs);
  color: var(--farbe-lila);
  text-decoration: underline;
  cursor: pointer;
}

.vm__protokoll h2 {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.vm__protokoll ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: var(--groesse-s);
}

/* Vorschau: schlichte Textmail */
.vm__vorschau {
  padding: var(--abstand-s) var(--abstand-m);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-creme);
}

.vm__vorschau-titel {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vh-gedaempft);
}

.vm__vorschau-kopf {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem var(--abstand-s);
  margin: 0;
  padding-bottom: var(--abstand-xs);
  border-bottom: 1px solid var(--vh-rand);
  font-size: var(--groesse-xs);
}

.vm__vorschau-kopf dt {
  color: var(--vh-gedaempft);
}

.vm__vorschau-kopf dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.vm__vorschau-mail {
  margin: var(--abstand-xs) 0 0;
  padding: var(--abstand-s);
  border-radius: var(--vh-radius);
  background: var(--farbe-weiss);
  font: inherit;
  font-size: var(--groesse-s);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
