<script setup lang="ts">
import { texte } from '~/texte'

const t = texte.ueberUns.ausweis
const name = ref('')
const feldId = useId()
const jahr = new Date().getFullYear()

// Antrag selbst folgt in Phase 7; bis dahin wird der Name mitgegeben
async function antragStarten() {
  await navigateTo({ path: '/mitglied-werden', query: name.value.trim() ? { name: name.value.trim() } : {} })
}
</script>

<template>
  <section id="mitglied-werden" class="ausweis" aria-labelledby="ausweis-titel">
    <div class="inhalt">
      <h2 id="ausweis-titel" class="ausweis__titel">
        Hier fehlt noch<br>
        <BasisHervorhebung>dein Name</BasisHervorhebung>
      </h2>
      <p class="ausweis__zusatz handschrift">{{ t.zusatz }}</p>

      <div class="ausweis__karte" aria-hidden="true">
        <div class="ausweis__kopf">
          <img src="/logo-mobil.svg" alt="" width="512" height="245" class="ausweis__logo">
          <p class="ausweis__art">Mitgliedsausweis</p>
        </div>
        <div class="ausweis__mitte">
          <div class="ausweis__namensfeld">
            <p class="ausweis__label">Name</p>
            <p class="ausweis__name handschrift" :class="{ 'ausweis__name--leer': !name.trim() }">
              {{ name.trim() || 'dein Name' }}
            </p>
          </div>
          <div class="ausweis__foto handschrift">dein<br>Foto</div>
        </div>
        <p class="ausweis__fuss strich-oben">Königsdorf rückt zusammen e.V. · Mitglied seit {{ jahr }}</p>
      </div>

      <form class="ausweis__formular" @submit.prevent="antragStarten">
        <label :for="feldId" class="nur-screenreader">{{ t.label }}</label>
        <input
          :id="feldId"
          v-model="name"
          type="text"
          name="name"
          autocomplete="name"
          maxlength="40"
          :placeholder="t.label"
          class="ausweis__eingabe"
        >
        <BasisKnopf type="submit" groesse="gross" class="ausweis__knopf">
          {{ t.knopf }} <span aria-hidden="true">→</span>
        </BasisKnopf>
      </form>
    </div>
  </section>
</template>

<style scoped>
/* Design: Titel 94px, Ausweis 672×421 (leicht gedreht), Eingabe + Knopf 57 hoch */
.ausweis {
  --farbe-fokus: var(--farbe-lila);
  padding-block: clamp(4rem, 8.5vw, 7.6rem) clamp(4rem, 9.6vw, 8.6rem);
  background: var(--farbe-orange);
  text-align: center;
}

.ausweis__titel {
  font-size: clamp(2.75rem, 6.5vw, 5.875rem);
  line-height: 0.9;
}

.ausweis__titel :deep(.hervorhebung) {
  margin-top: 0.04em;
}

.ausweis__zusatz {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-hand-l);
  color: var(--farbe-creme);
}

.ausweis__karte {
  max-width: 42rem;
  margin: clamp(2.5rem, 4.2vw, 3.75rem) auto 0;
  padding: clamp(1.25rem, 3vw, 2.75rem) clamp(1.25rem, 3vw, 2.75rem) clamp(1rem, 1.6vw, 1.4rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-pfirsich);
  box-shadow: 0 14px 30px rgb(0 0 0 / 0.2);
  text-align: left;
  transform: rotate(-1.6deg);
}

.ausweis__kopf {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.ausweis__logo {
  width: clamp(5.5rem, 7.7vw, 7rem);
}

.ausweis__art {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.25rem, 1.9vw, 1.75rem);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.ausweis__mitte {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--abstand-m);
  margin-top: var(--abstand-s);
}

.ausweis__namensfeld {
  flex: 1;
  min-width: 0;
}

.ausweis__label {
  margin: 0;
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-fett);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.ausweis__name {
  margin: 0.4rem 0 0;
  padding-bottom: 0.15rem;
  border-bottom: 3px solid var(--farbe-lila);
  font-size: clamp(2.5rem, 4.4vw, 4rem);
  line-height: 1.1;
  color: var(--farbe-lila);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ausweis__name--leer {
  opacity: 0.85;
}

.ausweis__foto {
  display: grid;
  flex: none;
  place-items: center;
  width: clamp(6rem, 10.4vw, 9.4rem);
  aspect-ratio: 150 / 178;
  border: 3px dashed var(--farbe-lila);
  border-radius: var(--radius-m);
  font-size: var(--groesse-hand-m);
  line-height: 1.1;
  text-align: center;
  color: var(--farbe-lila);
}

.ausweis__fuss {
  margin: clamp(1.25rem, 3vw, 2.75rem) calc(-1 * clamp(1.25rem, 3vw, 2.75rem)) 0;
  padding: clamp(0.9rem, 1.4vw, 1.25rem) clamp(1.25rem, 3vw, 2.75rem) 0;
  font-size: var(--groesse-xs);
  font-weight: var(--gewicht-text-mittel);
  color: var(--farbe-lila);
}

.ausweis__formular {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: clamp(2.5rem, 4.4vw, 4rem);
}

.ausweis__eingabe {
  flex: 0 1 20rem;
  min-width: 0;
  min-height: 3.5rem;
  padding: 0.5em 1.2em;
  border: 3px dotted var(--farbe-weiss);
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  font-size: var(--groesse-s);
  color: var(--farbe-schwarz);
}

.ausweis__eingabe::placeholder {
  color: #6b6b6b;
}

.ausweis__knopf {
  min-height: 3.5rem;
  font-size: var(--groesse-knopf);
}
</style>
