<script setup lang="ts">
import { links } from '~/navigation'
import { texte } from '~/texte'

const t = texte.mitgliedWerden
useSeoMeta({ title: 'Mitglied werden', description: t.meta, ogTitle: 'Mitglied werden – Königsdorf rückt zusammen', ogDescription: t.meta })

// Name aus dem Mitgliedsausweis (Über uns) übernehmen
const route = useRoute()
const [vorname = '', ...rest] = String(route.query.name ?? '').slice(0, 80).trim().split(/\s+/)

const form = reactive({
  art: 'foerder' as Mitgliedsart,
  beitrag_stufe: 'foerder_5' as BeitragStufe,
  beitrag_jahr: '' as string | number,
  plenum_besucht: null as boolean | null,
  vorname,
  nachname: rest.join(' '),
  strasse: '',
  plz: '',
  ort: 'Frechen',
  email: '',
  telefon: '',
  nachricht: '',
  satzung: false,
  einwilligung: false,
  website: '',
})

const optionen = computed(() => BEITRAEGE.filter(b => b.art === form.art))
const gewaehlt = computed(() => beitragFuer(form.beitrag_stufe))
const kannAbsenden = computed(() => form.art === 'foerder' || form.plenum_besucht === true)

// Beim Wechsel der Art einen passenden Beitrag vorwählen
watch(() => form.art, (art) => {
  form.beitrag_stufe = art === 'foerder' ? 'foerder_5' : 'standard'
  form.beitrag_jahr = ''
})

const { status, fehler, senden } = useFormular('/api/mitgliedsantrag')
const kopf = ref<HTMLElement>()

async function absenden() {
  await senden({ ...form, plenum_besucht: form.art === 'regulaer' ? form.plenum_besucht : null })
  if (status.value === 'fertig') kopf.value?.scrollIntoView({ block: 'start' })
}

function euro(n: number) {
  return `${n.toLocaleString('de-DE')} €`
}
</script>

<template>
  <div class="mitglied-seite">
    <header ref="kopf" class="kopf inhalt">
      <p class="kopf__zusatz handschrift">{{ form.vorname ? `Hallo ${form.vorname}!` : 'schön, dass du da bist!' }}</p>
      <h1 class="kopf__titel">Mitglied <BasisHervorhebung>werden</BasisHervorhebung></h1>
      <p class="kopf__intro">{{ t.intro }} <NuxtLink :to="links.mitmachen">Wie du mitmachen kannst →</NuxtLink></p>
    </header>

    <div class="inhalt">
      <BasisNotizzettel v-if="status === 'fertig'" farbe="pfirsich" tape="mitte" :drehung="-1" class="danke" role="status">
        <p class="handschrift danke__gruss">Willkommen im Verein, {{ form.vorname }}!</p>
        <p>Dein Antrag ist bei uns angekommen. Wir melden uns per Mail bei dir.</p>
        <p class="danke__konto">
          Deinen Beitrag ({{ euro(Number(form.beitrag_jahr) || (gewaehlt?.monat ?? 0) * 12) }} im Jahr) überweist du bitte an:<br>
          <strong>{{ KONTO.inhaber }}</strong> · IBAN <strong>{{ KONTO.iban }}</strong><br>
          Verwendungszweck: Mitgliedsbeitrag {{ form.vorname }} {{ form.nachname }}
        </p>
      </BasisNotizzettel>

      <form v-else class="antrag" novalidate @submit.prevent="absenden">
        <!-- 1. Art -->
        <fieldset class="schritt">
          <legend class="schritt__titel"><span class="schritt__nr">1</span> Wie möchtest du Mitglied werden?</legend>
          <div class="arten">
            <label class="art" :class="{ 'art--aktiv': form.art === 'foerder' }">
              <input v-model="form.art" type="radio" name="art" value="foerder" class="nur-screenreader">
              <span class="art__titel">{{ t.foerder.titel }}</span>
              <span class="art__text">{{ t.foerder.text }}</span>
            </label>
            <label class="art" :class="{ 'art--aktiv': form.art === 'regulaer' }">
              <input v-model="form.art" type="radio" name="art" value="regulaer" class="nur-screenreader">
              <span class="art__titel">{{ t.regulaer.titel }}</span>
              <span class="art__text">{{ t.regulaer.text }}</span>
              <span class="art__voraussetzung">{{ t.regulaer.voraussetzung }}</span>
            </label>
          </div>

          <!-- Plenum-Frage für reguläre Mitglieder -->
          <div v-if="form.art === 'regulaer'" class="plenum">
            <p id="plenum-frage" class="plenum__frage">Warst du schon einmal bei einem Plenum dabei?</p>
            <div class="plenum__antworten" role="radiogroup" aria-labelledby="plenum-frage">
              <label class="plenum__antwort"><input v-model="form.plenum_besucht" type="radio" name="plenum" :value="true"> Ja</label>
              <label class="plenum__antwort"><input v-model="form.plenum_besucht" type="radio" name="plenum" :value="false"> Noch nicht</label>
            </div>
            <p v-if="form.plenum_besucht === false" class="plenum__hinweis">
              Dann komm gern zum nächsten Plenum – jede*r kann einfach dazukommen!
              <NuxtLink :to="`${links.mitmachen}#plenum`">Zum Plenum →</NuxtLink><br>
              Bis dahin kannst du schon <button type="button" class="plenum__wechsel" @click="form.art = 'foerder'">Fördermitglied werden</button>.
            </p>
          </div>
        </fieldset>

        <!-- 2. Beitrag -->
        <fieldset v-if="kannAbsenden" class="schritt">
          <legend class="schritt__titel"><span class="schritt__nr">2</span> Dein Beitrag</legend>
          <div class="beitraege">
            <label
              v-for="o in optionen"
              :key="o.stufe"
              class="beitrag"
              :class="{ 'beitrag--aktiv': form.beitrag_stufe === o.stufe }"
            >
              <input v-model="form.beitrag_stufe" type="radio" name="beitrag" :value="o.stufe" class="nur-screenreader">
              <span class="beitrag__titel">{{ o.titel }}</span>
              <span v-if="o.hinweis" class="beitrag__hinweis">{{ o.hinweis }}</span>
              <span v-else class="beitrag__hinweis">{{ euro(o.monat * 12) }} im Jahr</span>
            </label>
          </div>
          <div v-if="gewaehlt?.mehrMoeglich && form.beitrag_stufe === gewaehlt.stufe" class="beitrag__mehr">
            <BasisFeld
              v-model="form.beitrag_jahr"
              label="Du möchtest mehr geben? Jahresbeitrag in €"
              type="number"
              name="beitrag_jahr"
              :min="gewaehlt.monat * 12"
              :placeholder="String(gewaehlt.monat * 12)"
            />
          </div>
        </fieldset>

        <!-- 3. Angaben -->
        <fieldset v-if="kannAbsenden" class="schritt">
          <legend class="schritt__titel"><span class="schritt__nr">3</span> Deine Angaben</legend>
          <div class="felder">
            <BasisFeld v-model="form.vorname" label="Vorname" name="vorname" autocomplete="given-name" required :maxlength="80" />
            <BasisFeld v-model="form.nachname" label="Nachname" name="nachname" autocomplete="family-name" required :maxlength="80" />
            <BasisFeld v-model="form.strasse" label="Straße und Hausnummer" name="strasse" autocomplete="street-address" required class="felder__breit" :maxlength="120" />
            <BasisFeld v-model="form.plz" label="PLZ" name="plz" autocomplete="postal-code" required :maxlength="5" />
            <BasisFeld v-model="form.ort" label="Ort" name="ort" autocomplete="address-level2" required :maxlength="80" />
            <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" required />
            <BasisFeld v-model="form.telefon" label="Telefon" type="tel" name="telefon" autocomplete="tel" :maxlength="40" />
            <BasisFeld v-model="form.nachricht" label="Möchtest du uns noch etwas sagen?" name="nachricht" mehrzeilig class="felder__breit" :maxlength="1000" />
          </div>

          <div class="nur-screenreader" aria-hidden="true">
            <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>

          <label class="haken">
            <input v-model="form.satzung" type="checkbox" required>
            <span>Ich habe die <NuxtLink to="/satzung" target="_blank">Satzung</NuxtLink> gelesen und möchte Mitglied werden.</span>
          </label>
          <label class="haken">
            <input v-model="form.einwilligung" type="checkbox" required>
            <span>Ich bin einverstanden, dass der Verein meine Angaben für die Mitgliederverwaltung speichert. Mehr in der <NuxtLink to="/datenschutz" target="_blank">Datenschutzerklärung</NuxtLink>.</span>
          </label>

          <div class="konto">
            <p class="konto__titel">So zahlst du</p>
            <p>Bitte überweis deinen Beitrag auf unser Vereinskonto:</p>
            <p><strong>{{ KONTO.inhaber }}</strong><br>IBAN <strong class="konto__iban">{{ KONTO.iban }}</strong></p>
            <p>Verwendungszweck: Mitgliedsbeitrag + dein Name. Du kannst auch einen Dauerauftrag einrichten.</p>
          </div>

          <p v-if="status === 'fehler'" class="fehler" role="alert">{{ fehler }}</p>

          <BasisKnopf type="submit" groesse="gross" :disabled="status === 'sendet'">
            {{ status === 'sendet' ? 'Wird gesendet …' : 'Antrag abschicken' }}
          </BasisKnopf>
        </fieldset>
      </form>
    </div>
  </div>
</template>

<style scoped>
.mitglied-seite {
  padding-bottom: var(--abstand-sektion);
}

.kopf {
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
  scroll-margin-top: 6rem;
}

.kopf__zusatz {
  margin: 0;
  color: var(--farbe-orange);
}

.kopf__titel {
  margin-top: 0.4rem;
  font-size: var(--groesse-h2-gross);
  line-height: 0.92;
}

.kopf__intro {
  max-width: 40rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.kopf__intro a {
  color: var(--farbe-lila);
  font-weight: var(--gewicht-text-mittel);
}

.antrag {
  display: grid;
  gap: var(--abstand-xl);
  max-width: 52rem;
  margin-top: var(--abstand-xl);
}

.schritt {
  display: grid;
  gap: var(--abstand-m);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.schritt__titel {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  line-height: 1;
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.schritt__nr {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--farbe-orange);
  font-size: 1.4rem;
  color: var(--farbe-schwarz);
}

/* ---------- Auswahlkacheln ---------- */
.arten,
.beitraege {
  display: grid;
  gap: var(--abstand-s);
}

.art,
.beitrag {
  position: relative;
  display: grid;
  gap: 0.4rem;
  align-content: start;
  padding: 1.25rem 1.4rem;
  border: 2px solid var(--farbe-lila);
  border-radius: var(--radius-l);
  background: var(--farbe-weiss);
  cursor: pointer;
  transition: background-color var(--dauer-kurz) ease, transform var(--dauer-kurz) ease;
}

.art:hover,
.beitrag:hover {
  transform: translateY(-2px);
}

.art--aktiv,
.beitrag--aktiv {
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.art--aktiv::after,
.beitrag--aktiv::after {
  content: '✓';
  position: absolute;
  top: 0.8rem;
  right: 1rem;
  font-weight: 700;
  color: var(--farbe-orange);
}

.art:has(input:focus-visible),
.beitrag:has(input:focus-visible) {
  outline: 3px solid var(--farbe-fokus);
  outline-offset: 3px;
}

.art__titel,
.beitrag__titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.375rem, 2vw, 1.75rem);
  line-height: 1;
  text-transform: uppercase;
}

.art--aktiv .art__titel,
.beitrag--aktiv .beitrag__titel {
  color: var(--farbe-pfirsich);
}

.art__text,
.beitrag__hinweis {
  font-size: var(--groesse-s);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.5;
}

.art__voraussetzung {
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  line-height: 1.1;
  color: var(--farbe-orange-text);
}

.art--aktiv .art__voraussetzung {
  color: var(--farbe-orange);
}

.beitrag__mehr {
  max-width: 22rem;
}

/* ---------- Plenum ---------- */
.plenum {
  padding: 1.25rem 1.4rem;
  border-radius: var(--radius-l);
  background: var(--farbe-pfirsich);
}

.plenum p {
  margin: 0;
}

.plenum__frage {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-l);
  text-transform: uppercase;
}

.plenum__antworten {
  display: flex;
  gap: var(--abstand-m);
  margin-top: 0.6rem;
}

.plenum__antwort {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  font-weight: var(--gewicht-text-normal);
  cursor: pointer;
}

.plenum__antwort input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--farbe-lila);
}

.plenum .plenum__hinweis {
  margin-top: 0.9rem;
  line-height: 1.6;
}

.plenum__hinweis a,
.plenum__wechsel {
  font-weight: var(--gewicht-text-mittel);
  color: var(--farbe-lila);
}

.plenum__wechsel {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: var(--gewicht-text-mittel);
  text-decoration: underline;
  cursor: pointer;
}

/* ---------- Angaben ---------- */
.felder {
  display: grid;
  gap: var(--abstand-s);
}

.haken {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: var(--groesse-s);
  line-height: 1.5;
}

.haken input {
  flex: none;
  width: 1.2rem;
  height: 1.2rem;
  margin-top: 0.15rem;
  accent-color: var(--farbe-lila);
}

.haken a {
  color: var(--farbe-lila);
}

.fehler {
  margin: 0;
  padding: 0.7rem 1rem;
  border-radius: var(--radius-m);
  background: var(--farbe-pfirsich);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.schritt :deep(.knopf) {
  justify-self: start;
}

.konto {
  padding: 1.1rem 1.4rem;
  border: 2px dashed var(--farbe-lila);
  border-radius: var(--radius-l);
  font-size: var(--groesse-s);
  line-height: 1.6;
}

.konto p {
  margin: 0 0 0.4rem;
}

.konto__titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-l);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.konto__iban {
  white-space: nowrap;
}

.danke__konto {
  margin-top: 0.8rem !important;
  font-size: var(--groesse-s);
  line-height: 1.6;
}

.danke {
  max-width: 36rem;
  margin-top: var(--abstand-xl);
  padding: var(--abstand-l);
}

.danke p {
  margin: 0;
}

.danke__gruss {
  margin-bottom: 0.5rem !important;
  color: var(--farbe-lila);
}

@media (min-width: 40rem) {
  .arten {
    grid-template-columns: 1fr 1fr;
  }

  .beitraege {
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .felder {
    grid-template-columns: 1fr 1fr;
  }

  .felder__breit {
    grid-column: 1 / -1;
  }
}
</style>
