<script setup lang="ts">
// Störer mit Anmeldung. Drei Fälle:
// - begrenzte Plätze: Hinweis + Restplätze (ausgebucht: kein Formular)
// - unbegrenzt: Anmeldung hilft uns bei der Planung, wir halten dich auf dem Laufenden
// - keine Anmeldung: "Einfach vorbeikommen"
const props = defineProps<{ termin: TerminDetail }>()

const { status, fehler, senden } = useFormular(() => `/api/termine/${props.termin.slug}/anmeldung`)
const form = reactive({ name: '', email: '', personen: 1, nachricht: '', einwilligung: false, website: '' })

const begrenzt = computed(() => props.termin.plaetze_frei !== null)
const ausgebucht = computed(() => props.termin.plaetze_frei === 0)
const formularZeigen = computed(() => props.termin.anmeldung_aktiv && !props.termin.vergangen && !ausgebucht.value)
const maxPersonen = computed(() => Math.min(10, props.termin.plaetze_frei ?? 10))

const titel = computed(() => {
  if (props.termin.vergangen) return 'Schon vorbei'
  if (!props.termin.anmeldung_aktiv) return 'Einfach vorbeikommen!'
  if (ausgebucht.value) return 'Leider ausgebucht'
  return begrenzt.value ? 'Nur begrenzte Plätze!' : 'Sag uns, dass du kommst!'
})

const hinweis = computed(() => {
  const t = props.termin
  if (t.vergangen) return 'Dieser Termin liegt schon zurück. Schau bei den anderen Terminen vorbei!'
  if (!t.anmeldung_aktiv) return 'Für diesen Termin musst du dich nicht anmelden. Wir freuen uns auf dich!'
  if (ausgebucht.value) return 'Alle Plätze sind vergeben. Schreib uns trotzdem gern – manchmal wird noch etwas frei.'
  if (begrenzt.value) return `Es gibt nur ${t.plaetze} Plätze – noch ${t.plaetze_frei} frei. Melde dich an, damit wir für dich planen können.`
  return 'Mit deiner Anmeldung halten wir dich zu diesem Termin auf dem Laufenden – und sie hilft uns, besser zu planen.'
})

function absenden() {
  senden({ ...form, personen: Number(form.personen) })
}
</script>

<template>
  <section id="anmeldung" class="stoerer" :class="{ 'stoerer--knapp': begrenzt && !ausgebucht }" aria-labelledby="stoerer-titel">
    <BasisKlebeband position="links" farbe="gelb" :drehung="-4" :breite="6" />
    <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" />
    <p class="stoerer__zusatz handschrift">{{ termin.anmeldung_aktiv && !termin.vergangen ? 'Anmeldezettel' : 'gut zu wissen' }}</p>

    <h2 id="stoerer-titel" class="stoerer__titel">{{ titel }}</h2>
    <p class="stoerer__hinweis">{{ hinweis }}</p>

    <template v-if="formularZeigen">
      <p v-if="status === 'fertig'" class="stoerer__danke" role="status">
        <span class="handschrift">Danke, {{ form.name }}!</span><br>
        Du bist angemeldet. Wir melden uns per Mail, wenn es Neuigkeiten gibt.
      </p>

      <form v-else class="stoerer__formular" novalidate @submit.prevent="absenden">
        <div class="stoerer__felder">
          <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
          <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" required />
          <BasisFeld v-model="form.personen" label="Personen" type="number" name="personen" required :min="1" :max="maxPersonen" />
        </div>
        <BasisFeld v-model="form.nachricht" label="Nachricht an uns" name="nachricht" mehrzeilig :maxlength="500" />

        <!-- Honeypot: für Menschen unsichtbar -->
        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>

        <label class="stoerer__einwilligung">
          <input v-model="form.einwilligung" type="checkbox" required>
          <span>Ich bin einverstanden, dass ihr meine Angaben für diesen Termin speichert und mich dazu per Mail kontaktiert. Mehr in der <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.</span>
        </label>

        <p v-if="status === 'fehler'" class="stoerer__fehler" role="alert">{{ fehler }}</p>

        <BasisKnopf type="submit" groesse="gross" :disabled="status === 'sendet'">
          {{ status === 'sendet' ? 'Wird gesendet …' : 'Anmelden' }}
        </BasisKnopf>
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

.stoerer :deep(.knopf) {
  justify-self: start;
}

@media (min-width: 40rem) {
  .stoerer__felder {
    grid-template-columns: 1fr 1fr 6.5rem;
  }
}
</style>
