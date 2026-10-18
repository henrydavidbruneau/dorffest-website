<script setup lang="ts">
// Gastbeitrag für den Dorfanzeiger über einen privaten Link (/gastbeitrag/:schluessel).
// Ohne Hauptnavigation; der Beitrag landet im Vereinsheim und erscheint erst nach dem Okay eines Mitglieds.
import { links } from '~/navigation'

definePageMeta({ layout: 'schlicht' })

const route = useRoute()
const schluessel = computed(() => String(route.params.schluessel))
const { data: einladung } = await useGastbeitrag(schluessel)

useSeoMeta({ title: 'Gastbeitrag für den Dorfanzeiger', robots: 'noindex, nofollow' })
// der Schlüssel im Link soll nicht per Referrer an andere Seiten gehen
useHead({ meta: [{ name: 'referrer', content: 'no-referrer' }] })

const { status, fehler, senden } = useFormular(() => `/api/gastbeitrag/${encodeURIComponent(schluessel.value)}`)
const form = reactive({
  titel: '',
  ressort: einladung.value?.ressort ?? 'dorffunk',
  teaser: '',
  inhalt: '',
  bildunterschrift: '',
  foto_von: '',
  autor_in: '',
  email: '',
  rechte: false,
  website: '', turnstile: '',
})

// Foto: wird im Browser verkleinert und erst beim Absenden mitgeschickt
const foto = shallowRef<Blob | null>(null)
const fotoVorschau = ref('')
const fotoFehler = ref('')
const fotoFeldId = useId()

async function fotoGewaehlt(e: Event) {
  const datei = (e.target as HTMLInputElement).files?.[0]
  fotoFehler.value = ''
  if (!datei) return
  try {
    foto.value = await fotoVerkleinern(datei)
    if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value)
    fotoVorschau.value = URL.createObjectURL(foto.value)
  }
  catch {
    fotoFehler.value = 'Dieses Foto können wir nicht lesen. Probier ein JPG oder PNG.'
  }
}

function fotoEntfernen() {
  foto.value = null
  if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value)
  fotoVorschau.value = ''
}

onBeforeUnmount(fotoEntfernen)

const woerter = computed(() => form.inhalt.trim() ? form.inhalt.trim().split(/\s+/).length : 0)

function absenden() {
  const daten = new FormData()
  for (const [feld, wert] of Object.entries(form)) daten.append(feld, String(wert))
  if (foto.value) daten.append('foto', foto.value, 'foto.jpg')
  senden(daten)
}
</script>

<template>
  <ZeitungBlatt breite="schmal" class="gast">
    <p class="gast__kopfzeile">
      <span>Dorfanzeiger</span>
      <span>Gastbeitrag</span>
    </p>

    <!-- Link ungültig, abgelaufen oder schon benutzt -->
    <div v-if="!einladung || !einladung.gueltig" class="gast__hinweis">
      <p class="gast__zusatz handschrift">schade!</p>
      <h1 class="gast__titel">
        <template v-if="einladung?.grund === 'eingereicht'">Dein Beitrag ist schon <BasisHervorhebung>bei uns</BasisHervorhebung></template>
        <template v-else>Dieser Link ist nicht mehr <BasisHervorhebung>gültig</BasisHervorhebung></template>
      </h1>
      <p class="gast__text">
        <template v-if="einladung?.grund === 'eingereicht'">Über diesen Link wurde schon ein Beitrag eingereicht. Wir schauen ihn uns an und melden uns.</template>
        <template v-else>Vielleicht ist er abgelaufen oder hat einen Tippfehler.</template>
        Du willst trotzdem etwas für den Dorfanzeiger schreiben? Schreib uns an
        <a :href="`mailto:${links.kontaktMail}`" class="gast__mail">{{ links.kontaktMail }}</a>.
      </p>
      <BasisKnopf to="/">Zur Startseite</BasisKnopf>
    </div>

    <!-- Danke -->
    <div v-else-if="status === 'fertig'" class="gast__hinweis" role="status">
      <p class="gast__zusatz handschrift">danke, {{ form.autor_in || einladung.name }}!</p>
      <h1 class="gast__titel">Dein Beitrag ist <BasisHervorhebung>angekommen</BasisHervorhebung></h1>
      <p class="gast__text">
        Jemand aus dem Verein liest ihn sich jetzt durch. Wenn wir Fragen haben oder etwas kürzen möchten,
        melden wir uns unter <strong>{{ form.email }}</strong>. Sobald er erscheint, sagen wir dir Bescheid.
      </p>
      <BasisKnopf to="/">Zur Startseite</BasisKnopf>
    </div>

    <!-- Formular -->
    <template v-else>
      <header class="gast__titelei">
        <p class="gast__zusatz handschrift">Hallo {{ einladung.name }}!</p>
        <h1 class="gast__titel">Schreib für den <BasisHervorhebung>Dorfanzeiger</BasisHervorhebung></h1>
        <p class="gast__text">
          Schön, dass du etwas beitragen möchtest. Schick uns deinen Text – gern mit Foto. Jemand aus dem Verein
          liest ihn, meldet sich bei Rückfragen, und nach dem Okay erscheint er im Dorfanzeiger. Kleinigkeiten wie
          Rechtschreibung oder die Länge passen wir eventuell an.
        </p>
      </header>

      <BasisTrennlinie class="gast__linie" />

      <form class="gast__formular" novalidate @submit.prevent="absenden">
        <fieldset class="gast__gruppe">
          <legend class="gast__abschnitt">Dein Text</legend>
          <BasisFeld v-model="form.titel" label="Titel" name="titel" required :maxlength="140" />
          <BasisFeld v-model="form.ressort" label="Rubrik" name="ressort" required :optionen="RESSORTS" />
          <BasisFeld
            v-model="form.teaser"
            label="Vorspann"
            name="teaser"
            mehrzeilig
            :zeilen="2"
            :maxlength="400"
            hinweis="Zwei, drei Sätze, die Lust aufs Lesen machen. Wenn du keine Idee hast, schreiben wir ihn."
          />
          <BasisFeld
            v-model="form.inhalt"
            label="Text"
            name="inhalt"
            mehrzeilig
            required
            :zeilen="14"
            :maxlength="15000"
            :hinweis="`Eine Leerzeile beginnt einen neuen Absatz. ${woerter ? `${woerter} Wörter.` : ''}`"
          />
        </fieldset>

        <fieldset class="gast__gruppe">
          <legend class="gast__abschnitt">Foto <span class="gast__optional">(optional)</span></legend>
          <div class="gast__foto">
            <label :for="fotoFeldId" class="gast__fotofeld" :class="{ 'gast__fotofeld--voll': fotoVorschau }">
              <img v-if="fotoVorschau" :src="fotoVorschau" alt="Vorschau deines Fotos">
              <span v-else class="handschrift">+ Foto auswählen</span>
            </label>
            <input :id="fotoFeldId" type="file" accept="image/*" class="nur-screenreader" @change="fotoGewaehlt">
            <div class="gast__fotoinfo">
              <p v-if="fotoFehler" class="gast__fehler" role="alert">{{ fotoFehler }}</p>
              <p v-else class="gast__klein">Ein Foto im Querformat passt am besten. Weitere Fotos kannst du uns später per Mail schicken.</p>
              <button v-if="fotoVorschau" type="button" class="gast__entfernen handlink" @click="fotoEntfernen">Foto entfernen</button>
            </div>
          </div>
          <template v-if="fotoVorschau">
            <BasisFeld v-model="form.bildunterschrift" label="Bildunterschrift" name="bildunterschrift" :maxlength="200" />
            <BasisFeld v-model="form.foto_von" label="Foto von" name="foto_von" :maxlength="80" />
          </template>
        </fieldset>

        <fieldset class="gast__gruppe">
          <legend class="gast__abschnitt">Über dich</legend>
          <div class="gast__felder">
            <BasisFeld v-model="form.autor_in" label="Name unter dem Beitrag" name="autor_in" autocomplete="name" required :maxlength="80" />
            <BasisFeld v-model="form.email" label="E-Mail für Rückfragen" type="email" name="email" autocomplete="email" required hinweis="Wird nicht veröffentlicht." />
          </div>
          <label class="gast__haken">
            <input v-model="form.rechte" type="checkbox" required>
            <span>Ich habe Text und Foto selbst gemacht (oder darf sie verwenden), auf dem Foto erkennbare Personen sind einverstanden, und der Verein darf den Beitrag bearbeitet im Dorfanzeiger veröffentlichen. Mehr in der <NuxtLink to="/datenschutz" target="_blank">Datenschutzerklärung</NuxtLink>.</span>
          </label>
        </fieldset>

        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <BasisTurnstile v-model="form.turnstile" />

        <p v-if="status === 'fehler'" class="gast__fehler" role="alert">{{ fehler }}</p>
        <BasisKnopf type="submit" :disabled="status === 'sendet'" class="gast__senden">
          {{ status === 'sendet' ? 'Wird gesendet …' : 'Beitrag einreichen' }}
        </BasisKnopf>
      </form>
    </template>
  </ZeitungBlatt>
</template>

<style scoped>
.gast {
  color: var(--farbe-schwarz);
}

.gast__kopfzeile {
  display: flex;
  justify-content: space-between;
  margin: 0 0 var(--abstand-l);
  padding-bottom: 0.6rem;
  border-bottom: 2px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-s);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.gast__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
  transform: rotate(-2deg);
  transform-origin: left;
}

.gast__titel {
  margin-top: 0.3rem;
  font-size: var(--groesse-h2-klein);
  line-height: 0.92;
}

.gast__text {
  max-width: 38rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.65;
}

.gast__hinweis {
  display: grid;
  justify-items: start;
  gap: var(--abstand-m);
  padding-block: var(--abstand-l);
}

.gast__hinweis .gast__text {
  margin: 0;
}

.gast__mail {
  color: var(--farbe-lila);
  overflow-wrap: anywhere;
}

.gast__linie {
  margin-block: var(--abstand-l);
}

.gast__formular {
  display: grid;
  gap: var(--abstand-l);
}

.gast__gruppe {
  display: grid;
  gap: var(--abstand-s);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.gast__abschnitt {
  margin-bottom: 0.4rem;
  padding: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.gast__optional {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text);
  font-size: var(--groesse-s);
  text-transform: none;
  color: var(--farbe-schwarz);
}

.gast__foto {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-m);
  align-items: center;
}

.gast__fotofeld {
  display: grid;
  place-items: center;
  width: min(100%, 16rem);
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--farbe-orange);
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  color: var(--farbe-lila);
  cursor: pointer;
  overflow: hidden;
}

.gast__fotofeld .handschrift {
  font-size: var(--groesse-hand-m);
}

.gast__fotofeld--voll {
  border-style: solid;
}

.gast__fotofeld img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Fokus der versteckten Dateiauswahl am sichtbaren Feld zeigen */
.gast__foto:has(input:focus-visible) .gast__fotofeld {
  outline: 3px solid var(--farbe-fokus);
  outline-offset: 3px;
}

.gast__fotoinfo {
  display: grid;
  gap: 0.4rem;
  justify-items: start;
  flex: 1 1 14rem;
}

.gast__klein {
  margin: 0;
  font-size: var(--groesse-xs);
  line-height: 1.5;
}

.gast__entfernen {
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  cursor: pointer;
}

.gast__felder {
  display: grid;
  gap: var(--abstand-s);
}

.gast__haken {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: var(--groesse-xs);
  line-height: 1.5;
  cursor: pointer;
}

.gast__haken input {
  flex: none;
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.15rem;
  accent-color: var(--farbe-lila);
}

.gast__haken a {
  color: var(--farbe-lila);
}

.gast__fehler {
  margin: 0;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-m);
  background: var(--farbe-pfirsich);
  font-size: var(--groesse-s);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.gast__senden {
  justify-self: start;
}

@media (min-width: 40rem) {
  .gast__felder {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
