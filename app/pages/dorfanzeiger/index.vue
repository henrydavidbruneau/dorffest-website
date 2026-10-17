<script setup lang="ts">
import { texte } from '~/texte'

definePageMeta({ layout: 'zeitung' })

const route = useRoute()
const ressort = computed<Ressort | undefined>(() => {
  const wert = String(route.query.ressort ?? '')
  return wert in RESSORTS ? (wert as Ressort) : undefined
})

const { data: ausgaben } = await useAusgaben()
// aktuelle Ausgabe = neueste erschienene
const aktuelle = computed(() => ausgaben.value.find(a => a.erschienen_am) ?? null)
const nummer = computed(() => aktuelle.value?.id)

const [{ data: artikel }, { data: termine }, { data: portraets }, { data: anzeigen }] = await Promise.all([
  useDorfanzeiger({ ressort, ausgabe: nummer }),
  useTermine({ mitDatum: true, limit: 3 }),
  usePortraets(nummer),
  useKleinanzeigen(4),
])

// Aufteilung wie im Design: Titelgeschichte, zwei in der Seitenspalte, Rest in der Reihe
const titel = computed(() => artikel.value[0] ?? null)
const seitenspalte = computed(() => artikel.value.slice(1, 3))
const reihe = computed(() => artikel.value.slice(3))
// Vorschau: die ersten drei reinen Textabsätze
const absaetze = computed(() => (titel.value ? textAbsaetze(titel.value.inhalt).slice(0, 3) : []))
// erschienene zuerst (neueste vorn), angekündigte hinten
const fruehere = computed(() => [
  ...ausgaben.value.filter(a => a.erschienen_am && a.id !== aktuelle.value?.id),
  ...ausgaben.value.filter(a => !a.erschienen_am),
])

useSeoMeta({
  title: 'Neuigkeiten – Der Königsdorfer Dorfanzeiger',
  description: texte.dorfanzeiger.beschreibung,
  ogTitle: 'Der Königsdorfer Dorfanzeiger',
  ogDescription: texte.dorfanzeiger.beschreibung,
})
</script>

<template>
  <div>
    <ZeitungBlatt>
      <ZeitungKopf :ausgabe="aktuelle" :ressort="ressort" />

      <p v-if="!titel" class="anzeiger__leer">
        In diesem Ressort ist in dieser Ausgabe nichts erschienen.
        <NuxtLink :to="{ query: {} }">Alle Ressorts zeigen</NuxtLink>
      </p>

      <div v-else class="anzeiger__oben">
        <!-- Titelgeschichte -->
        <article class="titelgeschichte">
          <p class="titelgeschichte__dachzeile">
            {{ titel.titelgeschichte ? 'Titelgeschichte · ' : '' }}{{ RESSORTS[titel.ressort] }}
          </p>
          <h2 class="titelgeschichte__titel">
            <NuxtLink :to="`/dorfanzeiger/${titel.slug}`">{{ titel.titel }}</NuxtLink>
          </h2>
          <p class="titelgeschichte__teaser">{{ titel.teaser }}</p>
          <figure v-if="titel.bild" class="titelgeschichte__bild">
            <NuxtImg :src="titel.bild" :alt="titel.bild_alt ?? ''" width="1280" height="780" sizes="100vw md:60vw lg:640px" />
            <figcaption v-if="titel.bildunterschrift" class="handschrift">{{ titel.bildunterschrift }}</figcaption>
          </figure>
          <p class="titelgeschichte__zeile">
            <span>{{ titel.autor_in ? `Text: ${titel.autor_in}` : '' }}</span>
            <span>
              <time v-if="titel.veroeffentlicht_am" :datetime="titel.veroeffentlicht_am">{{ datumLang(titel.veroeffentlicht_am) }}</time>
              <template v-if="titel.lesedauer_minuten"> · {{ titel.lesedauer_minuten }} Min.</template>
            </span>
          </p>
          <div class="titelgeschichte__text">
            <p v-for="(absatz, i) in absaetze" :key="i">
              {{ absatz }}
              <NuxtLink v-if="i === absaetze.length - 1" :to="`/dorfanzeiger/${titel.slug}`" class="titelgeschichte__weiter">
                Weiterlesen <span aria-hidden="true">→</span><span class="nur-screenreader">: {{ titel.titel }}</span>
              </NuxtLink>
            </p>
          </div>
        </article>

        <!-- Seitenspalte -->
        <aside class="anzeiger__seite" aria-label="Termine und weitere Meldungen">
          <ZeitungTerminkalender :termine="termine" />
          <BasisArtikelTeaser
            v-for="a in seitenspalte"
            :key="a.id"
            :artikel="a"
            variante="kompakt"
            class="anzeiger__meldung"
          />
        </aside>
      </div>

      <!-- 3er-Reihe -->
      <div v-if="reihe.length" class="anzeiger__reihe">
        <BasisArtikelTeaser v-for="a in reihe" :key="a.id" :artikel="a" variante="spalte" />
      </div>

      <!-- Porträt + Kleinanzeigen -->
      <div class="anzeiger__unten">
        <section v-if="portraets[0]" aria-labelledby="rubrik-portraet">
          <ZeitungRubrik id="rubrik-portraet" titel="Fünf Fragen an …" zusatz="das Porträt" />
          <ZeitungPortraet :portraet="portraets[0]" />
        </section>

        <section aria-labelledby="rubrik-kleinanzeigen">
          <ZeitungRubrik id="rubrik-kleinanzeigen" titel="Kleinanzeigen" zusatz="gesucht & gefunden" />
          <div class="anzeiger__anzeigen">
            <BasisKleinanzeige v-for="k in anzeigen" :key="k.id" :anzeige="k" />
          </div>
          <ZeitungMitgliedBox class="anzeiger__mitglied" />
        </section>
      </div>

      <!-- Frühere Ausgaben -->
      <section v-if="fruehere.length" class="anzeiger__ausgaben" aria-labelledby="rubrik-ausgaben">
        <ZeitungRubrik id="rubrik-ausgaben" titel="Frühere Ausgaben" zusatz="zum Stöbern" />
        <div class="anzeiger__ausgabenliste">
          <ZeitungAusgabeKarte v-for="a in fruehere" :key="a.id" :ausgabe="a" />
        </div>
      </section>
    </ZeitungBlatt>

    <!-- Newsletter unter dem Blatt -->
    <div class="anzeiger__newsletter">
      <p class="anzeiger__newsletter-text">{{ texte.dorfanzeiger.newsletterText }}</p>
      <BasisNewsletterBox variante="zettel" :label="texte.dorfanzeiger.newsletterLabel" class="anzeiger__zettel" />
    </div>
  </div>
</template>

<style scoped>
/* Maße aus dem Design (Blatt-Innenbreite 984): Spalte 640 | Linie | Seitenspalte 275 */
.anzeiger__leer {
  padding-block: var(--abstand-xl);
  text-align: center;
}

.anzeiger__oben {
  display: grid;
  gap: var(--abstand-l);
  margin-top: clamp(1.5rem, 2.8vw, 2.5rem);
}

/* ---------- Titelgeschichte ---------- */
.titelgeschichte p {
  margin: 0;
}

.titelgeschichte__dachzeile {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.titelgeschichte__titel {
  max-width: 10em;
  margin-top: 0.35rem;
  font-size: clamp(2.25rem, 4.6vw, 4.125rem);
  line-height: 0.95;
}

.titelgeschichte__titel a {
  text-decoration: none;
}

.titelgeschichte__titel a:hover {
  text-decoration: underline;
  text-decoration-thickness: 3px;
}

.titelgeschichte .titelgeschichte__teaser {
  margin-top: 0.9rem;
  font-size: clamp(1rem, 1.28vw, 1.15625rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.6;
}

.titelgeschichte__bild {
  margin: clamp(1rem, 1.7vw, 1.5rem) 0 0;
}

.titelgeschichte__bild img {
  width: 100%;
  aspect-ratio: 640 / 390;
  object-fit: cover;
}

.titelgeschichte__bild figcaption {
  margin-top: 0.3rem;
  font-size: clamp(1.25rem, 1.7vw, 1.5rem);
}

.titelgeschichte .titelgeschichte__zeile {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding-block: 0.45rem;
  border-top: 1.5px solid var(--farbe-schwarz);
  border-bottom: 1.5px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
}

/* Fließtext in drei Spalten mit Initiale (Design: 16px, Zeilenabstand 23.5) */
.titelgeschichte__text {
  margin-top: 1.4rem;
  font-size: clamp(0.9375rem, 1.04vw, 0.96rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.53;
  column-gap: 1.5rem;
}

.titelgeschichte__text p + p {
  margin-top: 0;
}

.titelgeschichte__text > p:first-child::first-letter {
  float: left;
  margin: 0.1rem 0.45rem 0 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 3.9rem;
  line-height: 0.8;
}

.titelgeschichte__weiter {
  display: inline-block;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.titelgeschichte__weiter:hover {
  text-decoration: underline;
}

/* ---------- Seitenspalte ---------- */
.anzeiger__seite {
  display: grid;
  gap: var(--abstand-m);
  align-content: start;
}

.anzeiger__meldung + .anzeiger__meldung {
  padding-top: var(--abstand-m);
  border-top: 1px solid var(--farbe-spaltenlinie);
}

/* ---------- 3er-Reihe ---------- */
.anzeiger__reihe {
  display: grid;
  gap: var(--abstand-l);
  margin-top: clamp(2rem, 3.2vw, 2.9rem);
  padding-top: var(--abstand-m);
  border-top: 5px solid var(--farbe-schwarz);
}

/* ---------- Porträt + Kleinanzeigen ---------- */
.anzeiger__unten {
  display: grid;
  gap: var(--abstand-xl);
  margin-top: clamp(2rem, 3.2vw, 2.9rem);
}

.anzeiger__anzeigen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.9rem;
  margin-top: var(--abstand-m);
}

.anzeiger__mitglied {
  margin-top: 0.9rem;
}

/* ---------- Frühere Ausgaben ---------- */
.anzeiger__ausgaben {
  margin-top: clamp(2.5rem, 3.4vw, 3rem);
}

.anzeiger__ausgabenliste {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(8.5rem, 40%), 11.25rem));
  gap: var(--abstand-m);
  margin-top: var(--abstand-l);
  padding-bottom: var(--abstand-xl);
}

/* ---------- Newsletter unter dem Blatt ---------- */
.anzeiger__newsletter {
  display: grid;
  gap: var(--abstand-xl);
  align-items: end;
  max-width: calc(75rem + 2 * var(--seitenrand));
  margin: clamp(4rem, 13vw, 12rem) auto 0;
  padding-inline: var(--seitenrand);
}

.anzeiger__newsletter-text {
  max-width: 30rem;
  margin: 0;
  font-size: clamp(1.125rem, 1.6vw, 1.4375rem);
  line-height: 1.55;
  color: var(--farbe-pfirsich);
}

.anzeiger__zettel {
  width: 100%;
  max-width: 36rem;
  justify-self: end;
}

@media (min-width: 48rem) {
  .titelgeschichte__text {
    column-count: 3;
  }

  .anzeiger__reihe {
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }

  .anzeiger__reihe > * {
    padding-inline: clamp(1rem, 1.7vw, 1.5rem);
  }

  .anzeiger__reihe > * + * {
    border-left: 1px solid var(--farbe-spaltenlinie);
  }

  .anzeiger__reihe > :first-child {
    padding-left: 0;
  }

  .anzeiger__reihe > :last-child {
    padding-right: 0;
  }

  .anzeiger__unten {
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 2.8vw, 2.5rem);
  }

  .anzeiger__newsletter {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 64rem) {
  .anzeiger__oben {
    grid-template-columns: minmax(0, 40rem) 1px minmax(0, 17.2rem);
    justify-content: space-between;
    gap: 0;
  }

  /* senkrechte Linie zwischen Hauptspalte und Seitenspalte */
  .anzeiger__oben::before {
    content: '';
    grid-column: 2;
    grid-row: 1;
    background: var(--farbe-schwarz);
    width: 2px;
  }

  .titelgeschichte {
    grid-column: 1;
    grid-row: 1;
  }

  .anzeiger__seite {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
