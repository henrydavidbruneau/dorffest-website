<script setup lang="ts">
import { texte } from '~/texte'

const verein = useVerein()

const { data: fragen } = await useFaq()
</script>

<template>
  <section class="fragen" aria-labelledby="fragen-titel">
    <div class="fragen__raster inhalt">
      <div class="fragen__links">
        <h2 id="fragen-titel" class="fragen__titel">Fragen?</h2>
        <BasisNotizzettel farbe="papier" befestigung="klammer" :drehung="-2.5" class="fragen__notiz">
          <p class="handschrift">
            {{ texte.start.fragen.notiz }}<br>
            <a :href="`mailto:${verein.kontakt_email}`" class="fragen__mail">{{ verein.kontakt_email }}</a>
          </p>
        </BasisNotizzettel>
      </div>

      <div class="fragen__rechts">
        <img
          src="/illustrationen/blumenfrau.svg"
          alt=""
          width="600"
          height="600"
          class="fragen__figur"
          loading="lazy"
        >
        <div class="fragen__liste strich-oben">
          <details v-for="(f, i) in fragen" :key="f.id" name="faq" class="fragen__eintrag strich-unten" :open="i === 0">
            <summary class="fragen__frage">
              <span>{{ f.frage }}</span>
              <span class="fragen__icon" aria-hidden="true" />
            </summary>
            <p class="fragen__antwort">{{ f.antwort }}</p>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Design: 166 oben, Titel 80px, FAQ 625 breit ab x=652, Zeilen 80 hoch */
.fragen {
  padding-block: clamp(4.5rem, 11.5vw, 10.375rem) clamp(4rem, 10.7vw, 9.625rem);
}

.fragen__raster {
  display: grid;
  gap: var(--abstand-xl);
}

.fragen__links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(3.5rem, 6.9vw, 6.25rem);
}

.fragen__titel {
  font-size: var(--groesse-h2-klein);
}

/* beiger Block mit Perforation oben und umgeschlagener Ecke */
.fragen__notiz {
  display: grid;
  place-items: center;
  width: clamp(15rem, 26vw, 23.5rem);
  aspect-ratio: 376 / 368;
  margin-left: max(-0.8rem, -0.9vw);
  padding: var(--abstand-l);
  border-radius: 2px;
  background: var(--farbe-notizpapier);
  box-shadow: 4px 8px 12px rgb(0 0 0 / 0.18);
}

.fragen__notiz::before {
  content: '';
  position: absolute;
  top: 0.9rem;
  right: 0.6rem;
  left: 0.6rem;
  height: 0.5rem;
  background: repeating-linear-gradient(90deg, #cfcabb 0 0.45rem, transparent 0.45rem 1.25rem);
}

/* umgeschlagene Ecke unten rechts: Seitenfarbe schneidet die Ecke, darunter der Umschlag */
.fragen__notiz::after {
  content: '';
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 28%;
  height: 30%;
  background: linear-gradient(to top left, var(--farbe-hintergrund) 50%, #e3dcc4 50%);
  border-top-left-radius: 70% 30%;
  box-shadow: -3px -3px 6px rgb(0 0 0 / 0.06);
}

.fragen__notiz p {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 2.25rem);
  line-height: 1.15;
  text-align: center;
  transform: rotate(-4deg);
}

.fragen__mail {
  font-size: 0.75em;
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.fragen__mail:hover {
  text-decoration: underline;
}

.fragen__rechts {
  position: relative;
  padding-top: 0;
}

/* Figur sitzt auf der oberen Linie, rechts */
.fragen__figur {
  position: absolute;
  right: clamp(1rem, 1.9vw, 1.7rem);
  bottom: calc(100% - 4px);
  width: clamp(5.5rem, 10.3vw, 9.25rem);
}

.fragen__liste {
  margin-top: clamp(0rem, 0.1vw, 0.1rem);
}

.fragen__frage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  min-height: clamp(4rem, 5.56vw, 5rem);
  padding-block: 0.75rem;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h4);
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--farbe-lila);
  cursor: pointer;
  list-style: none;
}

.fragen__frage::-webkit-details-marker {
  display: none;
}

/* dünnes oranges Plus, das sich beim Öffnen zum Kreuz dreht */
.fragen__icon {
  position: relative;
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-right: 0.3rem;
  color: var(--farbe-orange);
  transition: transform var(--dauer-mittel) ease;
}

.fragen__icon::before,
.fragen__icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
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
  padding-bottom: clamp(1.25rem, 2.1vw, 1.9rem);
  font-size: var(--groesse-s);
  line-height: 1.7;
}

@media (min-width: 56rem) {
  .fragen__raster {
    grid-template-columns: minmax(0, 1fr) minmax(0, 39rem);
    align-items: start;
    gap: var(--abstand-l);
  }

  /* obere Strichlinie auf Höhe der Unterkante von "Fragen?" */
  .fragen__rechts {
    padding-top: calc(var(--groesse-h2-klein) * 0.86);
  }
}
</style>
