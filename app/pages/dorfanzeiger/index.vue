<script setup lang="ts">
import { texte } from '~/texte'

definePageMeta({ layout: 'zeitung' })

const route = useRoute()
const ressort = computed<Ressort | undefined>(() => {
  const wert = String(route.query.ressort ?? '')
  return wert in RESSORTS ? (wert as Ressort) : undefined
})

const [{ data: artikel }, { data: termine }, { data: portraets }, { data: anzeigen }] = await Promise.all([
  useDorfanzeiger({ ressort }),
  useTermine({ mitDatum: true, limit: 3 }),
  usePortraets(),
  useKleinanzeigen(4),
])

// Neuester Artikel groß, die drei davor in der Reihe (mit Bild), alle weiteren in der Seitenspalte
const titel = computed(() => artikel.value[0] ?? null)
const reihe = computed(() => artikel.value.slice(1, 4))
const weitere = computed(() => artikel.value.slice(4, 14))
const stand = computed(() => titel.value?.veroeffentlicht_am ?? null)

// Seitenspalte nur so weit füllen, wie neben dem Hauptartikel Platz ist (Rest steht im Archiv)
const weitereEl = ref<HTMLElement | null>(null)
const sichtbar = ref(Infinity)
function spalteFuellen() {
  const el = weitereEl.value
  if (!el) return
  // nur nebeneinander (Desktop) begrenzen; mobil regelt CSS die Anzahl
  if (!window.matchMedia('(min-width: 64rem)').matches) {
    sichtbar.value = Infinity
    return
  }
  const hoehe = el.clientHeight
  const eintraege = [...el.children] as HTMLElement[]
  const passt = eintraege.findIndex(e => e.offsetTop + e.offsetHeight > hoehe)
  sichtbar.value = passt === -1 ? eintraege.length : passt
}
let beobachter: ResizeObserver | null = null
onMounted(() => {
  spalteFuellen()
  beobachter = new ResizeObserver(spalteFuellen)
  if (weitereEl.value) beobachter.observe(weitereEl.value)
})
onBeforeUnmount(() => beobachter?.disconnect())
watch(weitere, () => nextTick(spalteFuellen))

// Vorschau: die ersten drei reinen Textabsätze
const absaetze = computed(() => (titel.value ? textAbsaetze(titel.value.inhalt).slice(0, 3) : []))

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
      <ZeitungKopf :stand="stand" :ressort="ressort" />

      <p v-if="!titel" class="anzeiger__leer">
        In diesem Ressort ist noch nichts erschienen.
        <NuxtLink :to="{ query: {} }">Alle Ressorts zeigen</NuxtLink>
      </p>

      <div v-else class="anzeiger__oben">
        <!-- Titelgeschichte -->
        <article class="titelgeschichte">
          <p class="titelgeschichte__dachzeile">Neu · {{ RESSORTS[titel.ressort] }}</p>
          <h2 class="titelgeschichte__titel">
            <NuxtLink :to="`/dorfanzeiger/${titel.slug}`">{{ titel.titel }}</NuxtLink>
          </h2>
          <p class="titelgeschichte__teaser">{{ titel.teaser }}</p>
          <figure v-if="titel.bild" class="titelgeschichte__bild">
            <NuxtImg :src="titel.bild" :provider="bildAnbieter(titel.bild)" :alt="titel.bild_alt ?? ''" width="1280" height="780" sizes="100vw md:60vw lg:640px" />
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

        <!-- Seitenspalte: Termine, dann weitere Artikel, bis die Spalte voll ist -->
        <aside class="anzeiger__seite" aria-label="Termine und weitere Artikel">
          <ZeitungTerminkalender :termine="termine" />
          <div v-if="weitere.length" ref="weitereEl" class="anzeiger__weitere">
            <BasisArtikelTeaser
              v-for="(a, i) in weitere"
              :key="a.id"
              :artikel="a"
              variante="kompakt"
              class="anzeiger__meldung"
              :class="{ 'anzeiger__meldung--weg': i >= sichtbar }"
              :aria-hidden="i >= sichtbar ? 'true' : undefined"
              :inert="i >= sichtbar || undefined"
            />
          </div>
          <NuxtLink :to="{ path: '/dorfanzeiger/archiv', query: ressort ? { ressort } : {} }" class="anzeiger__archiv">
            Alle Artikel im Archiv <span aria-hidden="true">→</span>
          </NuxtLink>
        </aside>
      </div>

      <!-- 3er-Reihe: die drei Artikel vor dem neuesten -->
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

      <ZeitungLeserbriefe />
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

.anzeiger__weitere {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--abstand-m);
}

.anzeiger__meldung + .anzeiger__meldung {
  padding-top: var(--abstand-m);
  border-top: 1px solid var(--farbe-spaltenlinie);
}

/* mobil stehen nur drei weitere da, der Rest im Archiv */
.anzeiger__meldung:nth-child(n + 4) {
  display: none;
}

.anzeiger__meldung--weg {
  visibility: hidden;
}

.anzeiger__archiv {
  align-self: start;
  padding: 0.5rem 0 0.2rem;
  border-top: 3px double var(--farbe-schwarz);
  border-bottom: 3px double var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1rem, 1.25vw, 1.15rem);
  text-transform: uppercase;
  color: var(--farbe-lila);
  text-decoration: none;
}

.anzeiger__archiv:hover {
  color: var(--farbe-schwarz);
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

/* ---------- Newsletter unter dem Blatt ---------- */
.anzeiger__newsletter {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
  max-width: calc(75rem + 2 * var(--seitenrand));
  margin: clamp(3rem, 6vw, 5.5rem) auto 0;
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

/* mobil gerade (die Drehung kommt als Inline-Variable vom Notizzettel) */
@media (max-width: 47.99rem) {
  .anzeiger__newsletter .anzeiger__zettel {
    transform: none;
  }
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

  /* Die Seitenspalte bestimmt die Höhe nicht mit: sie ist so hoch wie der Hauptartikel,
     die weiteren Artikel füllen den Rest (überzählige blendet spalteFuellen() aus) */
  .anzeiger__seite {
    display: flex;
    flex-direction: column;
    grid-column: 3;
    grid-row: 1;
    height: 0;
    min-height: 100%;
  }

  .anzeiger__weitere {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .anzeiger__meldung:nth-child(n + 4) {
    display: flex;
  }

  .anzeiger__archiv {
    flex: none;
    margin-top: var(--abstand-m);
  }
}
</style>
