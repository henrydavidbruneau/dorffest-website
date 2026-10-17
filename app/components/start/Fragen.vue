<script setup lang="ts">
import { links } from '~/navigation'
import { texte } from '~/texte'

const { data: fragen } = await useFaq()
</script>

<template>
  <section class="fragen" aria-labelledby="fragen-titel">
    <div class="fragen__raster inhalt">
      <div class="fragen__links">
        <h2 id="fragen-titel">Fragen?</h2>
        <BasisNotizzettel farbe="pfirsich" befestigung="klammer" :drehung="-4" class="fragen__notiz">
          <p class="handschrift">
            {{ texte.start.fragen.notiz }}<br>
            <a :href="`mailto:${links.kontaktMail}`">{{ links.kontaktMail }}</a>
          </p>
        </BasisNotizzettel>
      </div>

      <div class="fragen__liste">
        <details v-for="(f, i) in fragen" :key="f.id" name="faq" class="fragen__eintrag" :open="i === 0">
          <summary class="fragen__frage">
            <span>{{ f.frage }}</span>
            <span class="fragen__icon" aria-hidden="true" />
          </summary>
          <p class="fragen__antwort">{{ f.antwort }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fragen {
  padding-block: var(--abstand-2xl);
}

.fragen__raster {
  display: grid;
  gap: var(--abstand-xl);
}

.fragen__links {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-xl);
}

.fragen__notiz {
  max-width: 15rem;
  padding: var(--abstand-l) var(--abstand-m);
}

.fragen__notiz p {
  margin: 0;
  font-size: 1.7rem;
  color: var(--farbe-lila);
  overflow-wrap: anywhere;
}

.fragen__notiz a {
  color: inherit;
}

.fragen__liste {
  border-top: 3px dotted var(--farbe-orange);
}

.fragen__eintrag {
  border-bottom: 3px dotted var(--farbe-orange);
}

.fragen__frage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  padding-block: var(--abstand-s);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-l);
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--farbe-lila);
  cursor: pointer;
  list-style: none;
}

.fragen__frage::-webkit-details-marker {
  display: none;
}

/* Plus, das sich beim Öffnen zum Kreuz dreht */
.fragen__icon {
  position: relative;
  flex: none;
  width: 1rem;
  height: 1rem;
  transition: transform var(--dauer-mittel) ease;
}

.fragen__icon::before,
.fragen__icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2.5px;
  background: currentColor;
  transform: translateY(-50%);
}

.fragen__icon::after {
  transform: translateY(-50%) rotate(90deg);
}

.fragen__eintrag[open] .fragen__icon {
  transform: rotate(45deg);
}

.fragen__antwort {
  margin: 0;
  padding-bottom: var(--abstand-m);
  font-size: var(--groesse-s);
}

@media (min-width: 56rem) {
  .fragen__raster {
    grid-template-columns: 1fr 1.6fr;
    align-items: start;
  }
}
</style>
