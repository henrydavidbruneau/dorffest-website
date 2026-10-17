<script setup lang="ts">
// Anmeldezettel. Fälle:
// - Anmeldung (begrenzt / unbegrenzt): Seite 1 Angaben, Seite 2 "Was bringst du mit?" (falls aktiv), dann absenden
// - keine Anmeldung, aber Mitbringen aktiv: nur das Mitbring-Formular
// - keine Anmeldung, kein Mitbringen: Hinweis "Einfach vorbeikommen"
const props = defineProps<{ termin: TerminDetail }>()

const anmeldung = useFormular(() => `/api/termine/${props.termin.slug}/anmeldung`)
const beitrag = useFormular(() => `/api/termine/${props.termin.slug}/beitrag`)

const form = reactive({ name: '', email: '', personen: 1, nachricht: '', mitbringen: '', einwilligung: false, website: '' })
const seite = ref<1 | 2>(1)
const pruefFehler = ref('')
const zettel = ref<HTMLElement>()

const begrenzt = computed(() => props.termin.plaetze_frei !== null)
const ausgebucht = computed(() => props.termin.plaetze_frei === 0)
const offen = computed(() => !props.termin.vergangen)
const mitAnmeldung = computed(() => offen.value && props.termin.anmeldung_aktiv && !ausgebucht.value)
const nurMitbringen = computed(() => offen.value && !props.termin.anmeldung_aktiv && props.termin.mitbringen_aktiv)
const zweiSeiten = computed(() => mitAnmeldung.value && props.termin.mitbringen_aktiv)
const maxPersonen = computed(() => Math.min(10, props.termin.plaetze_frei ?? 10))

const aktiv = computed(() => (nurMitbringen.value ? beitrag : anmeldung))
const fertig = computed(() => aktiv.value.status.value === 'fertig')
const sendet = computed(() => aktiv.value.status.value === 'sendet')
const fehler = computed(() => pruefFehler.value || (aktiv.value.status.value === 'fehler' ? aktiv.value.fehler.value : ''))

const titel = computed(() => {
  const t = props.termin
  if (t.vergangen) return 'Schon vorbei'
  if (!t.anmeldung_aktiv) return t.mitbringen_aktiv ? 'Bringst du was mit?' : 'Einfach vorbeikommen!'
  if (ausgebucht.value) return 'Leider ausgebucht'
  if (seite.value === 2) return 'Was bringst du mit?'
  return begrenzt.value ? 'Nur begrenzte Plätze!' : 'Sag uns, dass du kommst!'
})

const hinweis = computed(() => {
  const t = props.termin
  if (t.vergangen) return 'Dieser Termin liegt schon zurück. Schau bei den anderen Terminen vorbei!'
  if (!t.anmeldung_aktiv) {
    return t.mitbringen_aktiv
      ? 'Du musst dich nicht anmelden – komm einfach vorbei! Wenn du etwas beitragen magst, trag es hier ein.'
      : 'Für diesen Termin musst du dich nicht anmelden. Wir freuen uns auf dich!'
  }
  if (ausgebucht.value) return 'Alle Plätze sind vergeben. Schreib uns trotzdem gern – manchmal wird noch etwas frei.'
  if (seite.value === 2) return 'Ganz freiwillig – wenn nicht, komm einfach so!'
  if (begrenzt.value) return `Es gibt nur ${t.plaetze} Plätze – noch ${t.plaetze_frei} frei. Melde dich an, damit wir für dich planen können.`
  return 'Mit deiner Anmeldung halten wir dich zu diesem Termin auf dem Laufenden – und sie hilft uns, besser zu planen.'
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function pruefeSeite1() {
  if (!form.name.trim()) return 'Bitte gib deinen Namen an.'
  if (!EMAIL_RE.test(form.email.trim())) return 'Das sieht nicht nach einer E-Mail-Adresse aus.'
  const p = Number(form.personen)
  if (!Number.isInteger(p) || p < 1 || p > maxPersonen.value) return `Bitte gib an, mit wie vielen Personen du kommst (1–${maxPersonen.value}).`
  return ''
}

async function zuSeite(n: 1 | 2) {
  pruefFehler.value = n === 2 ? pruefeSeite1() : ''
  if (pruefFehler.value) return
  seite.value = n
  await nextTick()
  zettel.value?.scrollIntoView({ block: 'start' })
  zettel.value?.querySelector<HTMLElement>(n === 2 ? '.mitbring__chip, input[name=mitbringen]' : 'input[name=name]')?.focus()
}

async function absenden() {
  pruefFehler.value = ''
  if (nurMitbringen.value) {
    if (!form.mitbringen.trim()) return (pruefFehler.value = 'Was bringst du mit?')
    if (!form.name.trim()) return (pruefFehler.value = 'Bitte gib deinen Namen an.')
    return beitrag.senden({ name: form.name, was: form.mitbringen, email: form.email, website: form.website })
  }
  if (zweiSeiten.value && seite.value === 1) return zuSeite(2)
  pruefFehler.value = pruefeSeite1()
  if (pruefFehler.value) return
  if (!form.einwilligung) return (pruefFehler.value = 'Bitte stimm der Verarbeitung deiner Angaben zu.')
  await anmeldung.senden({ ...form, personen: Number(form.personen) })
}
</script>

<template>
  <section id="anmeldung" ref="zettel" class="stoerer" :class="{ 'stoerer--knapp': begrenzt && !ausgebucht }" aria-labelledby="stoerer-titel">
    <BasisKlebeband position="links" farbe="gelb" :drehung="-4" :breite="6" />
    <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" />

    <div class="stoerer__kopf">
      <p class="stoerer__zusatz handschrift">{{ mitAnmeldung ? 'Anmeldezettel' : nurMitbringen ? 'Mitbring-Liste' : 'gut zu wissen' }}</p>
      <p v-if="zweiSeiten && !fertig" class="stoerer__seite handschrift">Seite {{ seite }} von 2</p>
    </div>
    <h2 id="stoerer-titel" class="stoerer__titel">{{ fertig ? 'Danke!' : titel }}</h2>

    <p v-if="fertig" class="stoerer__danke" role="status">
      <template v-if="nurMitbringen">
        <span class="handschrift">Super, {{ form.name }}!</span><br>Wir haben notiert: {{ form.mitbringen }}.
      </template>
      <template v-else>
        <span class="handschrift">Schön, dass du dabei bist, {{ form.name }}!</span><br>
        Du bist angemeldet<template v-if="form.mitbringen.trim()"> und bringst {{ form.mitbringen }} mit</template>.
        Wir melden uns per Mail, wenn es Neuigkeiten gibt.
      </template>
    </p>

    <template v-else>
      <p class="stoerer__hinweis">{{ hinweis }}</p>

      <form v-if="mitAnmeldung || nurMitbringen" class="stoerer__formular" novalidate @submit.prevent="absenden">
        <!-- Seite 1: Angaben (bzw. Mitbringen ohne Anmeldung) -->
        <template v-if="nurMitbringen">
          <TerminMitbringFelder v-model="form.mitbringen" :termin="termin" pflicht />
          <div class="stoerer__felder stoerer__felder--zwei">
            <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
            <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" />
          </div>
        </template>

        <template v-else-if="seite === 1">
          <div class="stoerer__felder">
            <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
            <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" required />
            <BasisFeld v-model="form.personen" label="Personen" type="number" name="personen" required :min="1" :max="maxPersonen" />
          </div>
          <BasisFeld v-model="form.nachricht" label="Nachricht an uns" name="nachricht" mehrzeilig :maxlength="500" />
        </template>

        <!-- Seite 2: Was bringst du mit? -->
        <TerminMitbringFelder v-else v-model="form.mitbringen" :termin="termin" />

        <!-- Honeypot: für Menschen unsichtbar -->
        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>

        <label v-if="mitAnmeldung && (!zweiSeiten || seite === 2)" class="stoerer__einwilligung">
          <input v-model="form.einwilligung" type="checkbox" required>
          <span>Ich bin einverstanden, dass ihr meine Angaben für diesen Termin speichert und mich dazu per Mail kontaktiert. Mehr in der <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.</span>
        </label>

        <p v-if="fehler" class="stoerer__fehler" role="alert">{{ fehler }}</p>

        <div class="stoerer__knoepfe">
          <button v-if="zweiSeiten && seite === 2" type="button" class="stoerer__zurueck" @click="zuSeite(1)">← zurück</button>
          <BasisKnopf type="submit" groesse="gross" :disabled="sendet">
            <template v-if="sendet">Wird gesendet …</template>
            <template v-else-if="nurMitbringen">Eintragen</template>
            <template v-else-if="zweiSeiten && seite === 1">Weiter <span aria-hidden="true">→</span></template>
            <template v-else>Anmelden</template>
          </BasisKnopf>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.stoerer {
  position: relative;
  padding: clamp(2rem, 3.5vw, 3rem) clamp(1.5rem, 3.5vw, 3rem) clamp(1.75rem, 3vw, 2.5rem);
  border-radius: var(--radius-s);
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
  transform: rotate(-0.8deg);
  scroll-margin-top: 7rem;
}

/* begrenzte Plätze: Rand oben in Orange als Hinweis */
.stoerer--knapp {
  border-top: 6px solid var(--farbe-orange);
}

.stoerer__kopf {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.stoerer__seite {
  margin: 0;
  font-size: var(--groesse-hand-s);
  color: var(--farbe-lila);
}

.stoerer__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-s);
  align-items: center;
}

.stoerer__zurueck {
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  color: var(--farbe-lila);
  cursor: pointer;
}

.stoerer__zurueck:hover {
  text-decoration: underline;
}

.stoerer__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.stoerer__titel {
  margin-top: 0.2rem;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
}

.stoerer__hinweis {
  max-width: 36rem;
  margin: 0.6rem 0 0;
  font-weight: var(--gewicht-text-normal);
}

.stoerer__formular {
  display: grid;
  gap: var(--abstand-s);
  margin-top: var(--abstand-m);
  padding-top: var(--abstand-m);
  border-top: 2px dashed var(--farbe-lila);
}

.stoerer__felder {
  display: grid;
  gap: var(--abstand-s);
}

.stoerer__einwilligung {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: var(--groesse-xs);
  line-height: 1.5;
}

.stoerer__einwilligung input {
  flex: none;
  width: 1.2rem;
  height: 1.2rem;
  margin-top: 0.1rem;
  accent-color: var(--farbe-lila);
}

.stoerer__fehler {
  margin: 0;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-m);
  background: var(--farbe-pfirsich);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.stoerer__danke {
  margin: var(--abstand-m) 0 0;
  padding-top: var(--abstand-m);
  border-top: 2px dashed var(--farbe-lila);
  font-weight: var(--gewicht-text-normal);
}

.stoerer__danke .handschrift {
  color: var(--farbe-lila);
}

@media (min-width: 40rem) {
  .stoerer__felder {
    grid-template-columns: 1fr 1fr 6.5rem;
  }

  .stoerer__felder--zwei {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
