<script setup lang="ts">
// Optionales Formular "Was bringst du mit?" mit antippbaren Vorschlägen
const props = defineProps<{ termin: TerminDetail }>()

const { status, fehler, senden } = useFormular(() => `/api/termine/${props.termin.slug}/beitrag`)
const form = reactive({ name: '', was: '', email: '', website: '' })

function vorschlag(v: string) {
  const teile = form.was.split(',').map(t => t.trim()).filter(Boolean)
  form.was = teile.includes(v) ? teile.filter(t => t !== v).join(', ') : [...teile, v].join(', ')
}

const gewaehlt = (v: string) => form.was.split(',').map(t => t.trim()).includes(v)
</script>

<template>
  <section class="mitbringen" aria-labelledby="mitbringen-titel">
    <div class="mitbringen__inhalt">
      <p class="mitbringen__zusatz handschrift">gemeinsam ist’s schöner</p>
      <h2 id="mitbringen-titel" class="mitbringen__titel">
        Was bringst du <BasisHervorhebung>mit?</BasisHervorhebung>
      </h2>
      <p v-if="termin.mitbringen_text" class="mitbringen__text">{{ termin.mitbringen_text }}</p>

      <p v-if="status === 'fertig'" class="mitbringen__danke" role="status">
        <span class="handschrift">Super, danke {{ form.name }}!</span><br>Wir haben notiert: {{ form.was }}.
      </p>

      <form v-else class="mitbringen__formular" novalidate @submit.prevent="senden({ ...form })">
        <div v-if="termin.mitbringen_vorschlaege?.length" class="mitbringen__vorschlaege" role="group" aria-label="Vorschläge">
          <button
            v-for="v in termin.mitbringen_vorschlaege"
            :key="v"
            type="button"
            class="mitbringen__chip"
            :aria-pressed="gewaehlt(v)"
            @click="vorschlag(v)"
          >
            {{ v }}
          </button>
        </div>
        <BasisFeld v-model="form.was" label="Was bringst du mit?" name="was" required :maxlength="200" placeholder="z.B. ein Blech Plätzchen" />
        <div class="mitbringen__felder">
          <BasisFeld v-model="form.name" label="Name" name="name" autocomplete="name" required :maxlength="80" />
          <BasisFeld v-model="form.email" label="E-Mail" type="email" name="email" autocomplete="email" />
        </div>

        <div class="nur-screenreader" aria-hidden="true">
          <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>

        <p v-if="status === 'fehler'" class="mitbringen__fehler" role="alert">{{ fehler }}</p>

        <BasisKnopf type="submit" variante="hell" groesse="gross" :disabled="status === 'sendet'">
          {{ status === 'sendet' ? 'Wird gesendet …' : 'Eintragen' }}
        </BasisKnopf>
      </form>
    </div>
  </section>
</template>

<style scoped>
.mitbringen {
  --farbe-fokus: var(--farbe-gelb);
  padding-block: var(--abstand-sektion);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.mitbringen__inhalt {
  max-width: calc(44rem + 2 * var(--seitenrand));
  margin-inline: auto;
  padding-inline: var(--seitenrand);
}

.mitbringen__zusatz {
  margin: 0;
  color: var(--farbe-pfirsich);
  transform: rotate(-3deg);
}

.mitbringen__titel {
  margin-top: 0.4rem;
  font-size: var(--groesse-h2);
  color: var(--farbe-pfirsich);
}

.mitbringen__text {
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.mitbringen__formular {
  display: grid;
  gap: var(--abstand-s);
  margin-top: var(--abstand-l);
}

.mitbringen__formular :deep(.feld__label) {
  color: var(--farbe-pfirsich);
}

.mitbringen__formular :deep(.feld__optional) {
  color: var(--farbe-creme);
}

.mitbringen__formular :deep(.feld__eingabe) {
  border-color: var(--farbe-pfirsich);
}

.mitbringen__vorschlaege {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mitbringen__chip {
  padding: 0.45em 1em;
  border: 2px solid var(--farbe-pfirsich);
  border-radius: 999px;
  background: transparent;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-s);
  text-transform: uppercase;
  color: var(--farbe-pfirsich);
  cursor: pointer;
  transition: background-color var(--dauer-kurz) ease, color var(--dauer-kurz) ease;
}

.mitbringen__chip[aria-pressed='true'] {
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.mitbringen__chip[aria-pressed='true']::before {
  content: '✓ ';
}

.mitbringen__felder {
  display: grid;
  gap: var(--abstand-s);
}

.mitbringen__fehler {
  margin: 0;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-m);
  background: var(--farbe-weiss);
  font-weight: var(--gewicht-text-mittel);
  color: #a3001b;
}

.mitbringen__danke {
  margin: var(--abstand-l) 0 0;
  font-size: var(--groesse-l);
}

.mitbringen__danke .handschrift {
  color: var(--farbe-pfirsich);
}

.mitbringen :deep(.knopf) {
  justify-self: start;
}

@media (min-width: 40rem) {
  .mitbringen__felder {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
