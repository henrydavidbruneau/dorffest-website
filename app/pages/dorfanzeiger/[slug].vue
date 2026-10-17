<script setup lang="ts">
import { links } from '~/navigation'

definePageMeta({ layout: 'zeitung' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: artikel } = await useArtikel(slug)
if (!artikel.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artikel nicht gefunden', fatal: true })
}

const [{ data: ausgaben }, { data: ausgabeArtikel }] = await Promise.all([
  useAusgaben(),
  useDorfanzeiger({ ausgabe: artikel.value.ausgabe ?? undefined, mitInterviews: true }),
])

const ausgabe = computed(() => ausgaben.value.find(a => a.id === artikel.value?.ausgabe) ?? null)
const kopfzeile = computed(() => {
  const a = ausgabe.value
  if (!a) return ''
  const teile = [`Nr. ${a.nummer}`, `${JAHRESZEITEN[a.jahreszeit]} ${a.jahr}`]
  if (artikel.value?.seite) teile.push(`Seite ${artikel.value.seite}`)
  return teile.join(' · ')
})

function ressortName(a: Artikel) {
  return a.art === 'interview' ? 'Porträt' : RESSORTS[a.ressort]
}

const dachzeile = computed(() => {
  const a = artikel.value!
  return `${a.titelgeschichte ? 'Titelgeschichte · ' : ''}${ressortName(a)}`
})

// Mehr aus dieser Ausgabe: zwei Beiträge aus anderen Ressorts, dann das Porträt
const mehr = computed(() => {
  const andere = ausgabeArtikel.value.filter(a => a.slug !== slug.value)
  const beitraege = andere.filter(a => a.art === 'artikel')
  const fremdeRessorts = beitraege.filter(a => a.ressort !== artikel.value?.ressort)
  const auswahl = [...fremdeRessorts, ...beitraege.filter(a => !fremdeRessorts.includes(a))].slice(0, 2)
  const interview = andere.find(a => a.art === 'interview')
  return interview ? [...auswahl, interview] : beitraege.slice(0, 3)
})

// Weitersagen
const seitenUrl = useRequestURL()
const url = computed(() => `${seitenUrl.origin}${route.path}`)
const teilenText = computed(() => `${artikel.value!.titel} – Der Königsdorfer Dorfanzeiger`)
const kopiert = ref(false)
async function linkKopieren() {
  try {
    await navigator.clipboard.writeText(url.value)
    kopiert.value = true
    setTimeout(() => (kopiert.value = false), 2500)
  }
  catch {
    window.prompt('Link kopieren:', url.value)
  }
}

useSeoMeta({
  title: () => artikel.value?.titel,
  description: () => artikel.value?.teaser,
  ogTitle: () => artikel.value?.titel,
  ogDescription: () => artikel.value?.teaser,
  ogType: 'article',
  ogImage: () => (artikel.value?.bild ? `${seitenUrl.origin}${artikel.value.bild}` : undefined),
  articlePublishedTime: () => artikel.value?.veroeffentlicht_am ?? undefined,
  articleAuthor: () => (artikel.value?.autor_in ? [artikel.value.autor_in] : undefined),
})
</script>

<template>
  <ZeitungBlatt v-if="artikel" breite="schmal">
    <!-- kleiner Zeitungskopf -->
    <div class="beitrag__kopf">
      <NuxtLink to="/dorfanzeiger" class="beitrag__zeitung">Der Königsdorfer Dorfanzeiger</NuxtLink>
      <span>{{ kopfzeile }}</span>
    </div>

    <NuxtLink to="/dorfanzeiger" class="beitrag__zurueck handlink">← zur ganzen Ausgabe</NuxtLink>

    <header class="beitrag__titelei">
      <p class="beitrag__dachzeile">{{ dachzeile }}</p>
      <h1 class="beitrag__titel">{{ artikel.titel }}</h1>
      <p class="beitrag__vorspann">{{ artikel.teaser }}</p>
    </header>

    <div class="beitrag__zeile">
      <span class="beitrag__autor">
        <NuxtImg
          v-if="artikel.autor_in_bild"
          :src="artikel.autor_in_bild"
          alt=""
          width="64"
          height="64"
          class="beitrag__autorbild"
        />
        <template v-if="artikel.autor_in">Text: {{ artikel.autor_in }}</template>
      </span>
      <span>
        <time v-if="artikel.veroeffentlicht_am" :datetime="artikel.veroeffentlicht_am">{{ datumLang(artikel.veroeffentlicht_am) }}</time>
        <template v-else-if="artikel.datum_text">{{ artikel.datum_text }}</template>
        <template v-if="artikel.lesedauer_minuten"> · {{ artikel.lesedauer_minuten }} Min. Lesezeit</template>
      </span>
    </div>

    <figure v-if="artikel.bild" class="beitrag__hauptbild">
      <NuxtImg
        :src="artikel.bild"
        :alt="artikel.bild_alt ?? ''"
        width="1480"
        height="760"
        sizes="100vw md:740px"
        preload
      />
      <figcaption v-if="artikel.bildunterschrift">{{ artikel.bildunterschrift }}</figcaption>
    </figure>

    <!-- eslint-disable-next-line vue/no-v-html -- serverseitig aus Markdown erzeugt, rohes HTML wird escaped -->
    <div class="beitrag__text" v-html="artikel.inhalt_html" />

    <aside v-if="artikel.aufruf_titel" class="beitrag__aufruf">
      <div>
        <p class="beitrag__aufruf-titel">{{ artikel.aufruf_titel }}</p>
        <p v-if="artikel.aufruf_text" class="beitrag__aufruf-text">{{ artikel.aufruf_text }}</p>
      </div>
      <BasisKnopf v-if="artikel.aufruf_link" :to="artikel.aufruf_link" groesse="klein">
        {{ artikel.aufruf_knopf ?? 'Mitmachen' }}
      </BasisKnopf>
    </aside>

    <div class="beitrag__teilen">
      <span>Weitersagen:</span>
      <a :href="`https://wa.me/?text=${encodeURIComponent(`${teilenText} ${url}`)}`" target="_blank" rel="noopener">WhatsApp</a>
      <a :href="`mailto:?subject=${encodeURIComponent(teilenText)}&body=${encodeURIComponent(url)}`">E-Mail</a>
      <button type="button" @click="linkKopieren">Link kopieren</button>
      <span class="beitrag__kopiert" aria-live="polite">{{ kopiert ? 'Kopiert!' : '' }}</span>
    </div>

    <section v-if="mehr.length" class="beitrag__mehr" aria-labelledby="mehr-titel">
      <div class="beitrag__mehr-kopf">
        <h2 id="mehr-titel">Mehr aus dieser Ausgabe</h2>
        <NuxtLink to="/dorfanzeiger">Alle Beiträge <span aria-hidden="true">→</span></NuxtLink>
      </div>
      <ul class="beitrag__mehr-liste">
        <li v-for="a in mehr" :key="a.id" class="beitrag__mehr-eintrag">
          <NuxtImg
            v-if="a.bild"
            :src="a.bild"
            :alt="a.bild_alt ?? ''"
            width="560"
            height="160"
            sizes="100vw md:240px"
            class="beitrag__mehr-bild"
          />
          <p class="beitrag__mehr-ressort">{{ ressortName(a) }}</p>
          <h3 class="beitrag__mehr-titel">
            <NuxtLink :to="`/dorfanzeiger/${a.slug}`">{{ a.titel }}</NuxtLink>
          </h3>
        </li>
      </ul>
    </section>

    <p class="beitrag__impressum">
      Der Dorfanzeiger · Rückt Zusammen e.V. · Baumschulenstraße 28, 50226 Frechen<br>
      Leserbriefe: <a :href="`mailto:${links.kontaktMail}`">{{ links.kontaktMail }}</a>
    </p>
  </ZeitungBlatt>
</template>

<style scoped>
/* Abgeleitet aus "Dorfanzeiger Beitrag.pdf" (mobil, 280px Satzbreite), für Desktop hochskaliert */
.beitrag__kopf {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding-bottom: 0.45rem;
  border-bottom: 4px double var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.8125rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
}

.beitrag__zeitung {
  font-size: 1.25em;
  text-decoration: none;
}

.beitrag__zeitung:hover {
  text-decoration: underline;
}

.beitrag__zurueck {
  display: inline-block;
  margin-top: var(--abstand-m);
  color: var(--farbe-orange-text);
}

.beitrag__titelei {
  margin-top: var(--abstand-m);
}

.beitrag__titelei p {
  margin: 0;
}

.beitrag__dachzeile {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.beitrag__titel {
  margin-top: 0.4rem;
  font-size: clamp(2.25rem, 4.6vw, 4rem);
  line-height: 0.95;
}

.beitrag__titelei .beitrag__vorspann {
  margin-top: 0.9rem;
  font-size: clamp(1rem, 1.3vw, 1.1875rem);
  font-weight: var(--gewicht-text-mittel);
  line-height: 1.5;
}

.beitrag__zeile {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  margin-top: var(--abstand-m);
  padding-block: 0.5rem;
  border-top: 2px solid var(--farbe-schwarz);
  border-bottom: 2px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.8125rem, 1vw, 0.875rem);
  text-transform: uppercase;
}

.beitrag__autor {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.beitrag__autorbild {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

/* ---------- Bilder ---------- */
.beitrag__hauptbild,
.beitrag__text :deep(figure) {
  margin: var(--abstand-m) 0 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--farbe-spaltenlinie);
}

.beitrag__hauptbild img {
  width: 100%;
  aspect-ratio: 2 / 1;
  object-fit: cover;
}

.beitrag__text :deep(figure img) {
  width: 100%;
  aspect-ratio: 3 / 1;
  object-fit: cover;
}

.beitrag__hauptbild figcaption,
.beitrag__text :deep(figcaption) {
  margin-top: 0.3rem;
  font-family: var(--schrift-hand);
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  line-height: 1.1;
}

/* ---------- Fließtext ---------- */
.beitrag__text {
  margin-top: var(--abstand-l);
  font-size: clamp(1rem, 1.15vw, 1.0625rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.75;
}

/* Text leicht eingerückt, Bilder und Zitate laufen über die volle Breite */
.beitrag__text :deep(p),
.beitrag__text :deep(h2),
.beitrag__text :deep(h3),
.beitrag__text :deep(h4) {
  max-width: 40rem;
  margin: 0 0 1em;
  padding-left: clamp(0.5rem, 1.6vw, 1.25rem);
}

.beitrag__text :deep(h2),
.beitrag__text :deep(h3),
.beitrag__text :deep(h4) {
  margin-top: 1.4em;
  margin-bottom: 0.4em;
  font-size: clamp(1.25rem, 1.8vw, 1.5rem);
  line-height: 1.1;
}

/* Initiale: am Anfang und nach einem Bild */
.beitrag__text :deep(> p:first-child::first-letter),
.beitrag__text :deep(figure + p::first-letter) {
  float: left;
  margin: 0.08em 0.4rem 0 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 3.6em;
  line-height: 0.8;
  color: var(--farbe-orange);
}

.beitrag__text :deep(figure + p) {
  margin-top: var(--abstand-l);
}

.beitrag__text :deep(a) {
  color: var(--farbe-lila);
  text-decoration-color: var(--farbe-orange);
}

/* Zitatkasten zwischen dicken Linien */
.beitrag__text :deep(blockquote) {
  margin: var(--abstand-l) 0;
  padding: var(--abstand-m) var(--abstand-s);
  border-top: 4px solid var(--farbe-schwarz);
  border-bottom: 4px solid var(--farbe-schwarz);
  text-align: center;
}

.beitrag__text :deep(blockquote p) {
  max-width: none;
  margin: 0;
  padding: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.5rem, 2.6vw, 2.25rem);
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.beitrag__text :deep(blockquote footer) {
  margin-top: 0.4rem;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange-text);
}

/* ---------- Aufruf ---------- */
.beitrag__aufruf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  margin: var(--abstand-l) clamp(0.5rem, 1.6vw, 1.25rem) 0;
  padding: 1.1rem 1.4rem;
  border: 4px solid var(--farbe-schwarz);
  border-radius: var(--radius-l);
  background: var(--farbe-gelb);
  box-shadow: 0 0 0 5px var(--farbe-gelb);
}

.beitrag__aufruf p {
  margin: 0;
}

.beitrag__aufruf-titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.375rem, 2vw, 1.75rem);
  line-height: 1;
}

.beitrag__aufruf-text {
  margin-top: 0.25rem !important;
  font-size: var(--groesse-xs);
}

/* ---------- Weitersagen ---------- */
.beitrag__teilen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.4rem;
  margin: var(--abstand-l) clamp(0.5rem, 1.6vw, 1.25rem) 0;
  padding-top: 0.7rem;
  border-top: 2px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
}

.beitrag__teilen a,
.beitrag__teilen button {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-transform: inherit;
  text-decoration: none;
  cursor: pointer;
}

.beitrag__teilen a:hover,
.beitrag__teilen button:hover {
  color: var(--farbe-lila);
  text-decoration: underline;
}

.beitrag__kopiert {
  color: var(--farbe-lila);
}

/* ---------- Mehr aus dieser Ausgabe ---------- */
.beitrag__mehr {
  margin-top: var(--abstand-xl);
}

.beitrag__mehr-kopf {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.6rem 0.4rem;
  border-top: 4px solid var(--farbe-schwarz);
  border-bottom: 1.5px solid var(--farbe-schwarz);
}

.beitrag__mehr-kopf h2 {
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  color: var(--farbe-schwarz);
}

.beitrag__mehr-kopf a {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.beitrag__mehr-kopf a:hover {
  text-decoration: underline;
}

.beitrag__mehr-liste {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.beitrag__mehr-eintrag {
  position: relative;
  padding-block: var(--abstand-s);
}

.beitrag__mehr-eintrag + .beitrag__mehr-eintrag {
  border-top: 1px solid var(--farbe-spaltenlinie);
}

.beitrag__mehr-bild {
  width: 100%;
  aspect-ratio: 7 / 2;
  object-fit: cover;
  object-position: center 30%;
}

.beitrag__mehr-eintrag p {
  margin: 0.5rem 0 0;
}

.beitrag__mehr-ressort {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-xs);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.beitrag__mehr-titel {
  margin-top: 0.15rem;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  line-height: 1.05;
}

.beitrag__mehr-titel a {
  text-decoration: none;
}

/* ganze Kachel klickbar */
.beitrag__mehr-titel a::after {
  content: '';
  position: absolute;
  inset: 0;
}

.beitrag__mehr-eintrag:hover .beitrag__mehr-titel a {
  text-decoration: underline;
}

.beitrag__impressum {
  margin: var(--abstand-l) 0 0;
  padding-top: 0.6rem;
  border-top: 1.5px solid var(--farbe-schwarz);
  font-size: var(--groesse-xs);
  line-height: 1.6;
}

.beitrag__impressum a {
  color: inherit;
}

@media (min-width: 48rem) {
  .beitrag__mehr-liste {
    grid-template-columns: repeat(3, 1fr);
  }

  .beitrag__mehr-eintrag {
    padding-inline: var(--abstand-s);
  }

  .beitrag__mehr-eintrag:first-child {
    padding-left: 0;
  }

  .beitrag__mehr-eintrag:last-child {
    padding-right: 0;
  }

  .beitrag__mehr-eintrag + .beitrag__mehr-eintrag {
    border-top: 0;
    border-left: 1px solid var(--farbe-spaltenlinie);
  }

  .beitrag__mehr-bild {
    aspect-ratio: 16 / 9;
  }
}
</style>
