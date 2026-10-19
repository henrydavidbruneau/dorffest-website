<script setup lang="ts">

const verein = useVerein()

definePageMeta({ layout: 'zeitung' })

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: artikel } = await useArtikel(slug)
if (!artikel.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artikel nicht gefunden', fatal: true })
}

// Angemeldet im Vereinsheim? Dann „Bearbeiten“ zeigen. Nur im Browser über den lesbaren
// Hinweis-Cookie – abgelaufene Sitzung landet beim Klick einfach am Login.
const angemeldet = ref(false)
onMounted(() => {
  angemeldet.value = document.cookie.split('; ').some(c => c.startsWith('vh_angemeldet='))
})

const { data: neueste } = await useDorfanzeiger({ mitInterviews: true, limit: 12 })

// Kopfzeile: Ressort und Monat
const kopfzeile = computed(() => {
  const a = artikel.value
  if (!a) return ''
  const wann = a.veroeffentlicht_am
  return [RESSORTS[a.ressort], wann ? monatJahr(wann) : null].filter(Boolean).join(' · ')
})

const dachzeile = computed(() => RESSORTS[artikel.value!.ressort])

// Mehr aus dem Dorfanzeiger: zwei neue Beiträge möglichst aus anderen Ressorts, dann das Porträt
const mehr = computed(() => {
  const andere = neueste.value.filter(a => a.slug !== slug.value)
  const beitraege = andere.filter(a => a.ressort !== 'portraets')
  const fremdeRessorts = beitraege.filter(a => a.ressort !== artikel.value?.ressort)
  const auswahl = [...fremdeRessorts, ...beitraege.filter(a => !fremdeRessorts.includes(a))].slice(0, 2)
  const interview = andere.find(a => a.ressort === 'portraets')
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
  ogImage: () => (artikel.value?.bild ? `${seitenUrl.origin}${bildUrl(artikel.value.bild)}` : undefined),
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

    <NuxtLink to="/dorfanzeiger" class="beitrag__zurueck handlink">← zum Dorfanzeiger</NuxtLink>

    <!-- nur für Angemeldete: schwebt unten rechts (am body, weil das gedrehte Blatt `fixed` sonst einfängt) -->
    <Teleport v-if="angemeldet" to="body">
      <BasisKnopf :to="`/vereinsheim/dorfanzeiger/artikel/${artikel.id}`" groesse="klein" class="beitrag__bearbeiten">Bearbeiten</BasisKnopf>
    </Teleport>

    <ZeitungArtikel :artikel="artikel" :dachzeile="dachzeile" />

    <div class="beitrag__teilen">
      <span>Weitersagen:</span>
      <a :href="`https://wa.me/?text=${encodeURIComponent(`${teilenText} ${url}`)}`" target="_blank" rel="noopener">WhatsApp</a>
      <a :href="`mailto:?subject=${encodeURIComponent(teilenText)}&body=${encodeURIComponent(url)}`">E-Mail</a>
      <button type="button" @click="linkKopieren">Link kopieren</button>
      <span class="beitrag__kopiert" aria-live="polite">{{ kopiert ? 'Kopiert!' : '' }}</span>
    </div>

    <section v-if="mehr.length" class="beitrag__mehr" aria-labelledby="mehr-titel">
      <div class="beitrag__mehr-kopf">
        <h2 id="mehr-titel">Mehr aus dem Dorfanzeiger</h2>
        <NuxtLink to="/dorfanzeiger/archiv">Alle Beiträge im Archiv <span aria-hidden="true">→</span></NuxtLink>
      </div>
      <ul class="beitrag__mehr-liste">
        <li v-for="a in mehr" :key="a.id" class="beitrag__mehr-eintrag">
          <NuxtImg
            v-if="a.bild"
            :src="a.bild" :provider="bildAnbieter(a.bild)"
            :alt="a.bild_alt ?? ''"
            width="560"
            height="160"
            sizes="100vw md:240px"
            class="beitrag__mehr-bild"
          />
          <p class="beitrag__mehr-ressort">{{ RESSORTS[a.ressort] }}</p>
          <h3 class="beitrag__mehr-titel">
            <NuxtLink :to="`/dorfanzeiger/${a.slug}`">{{ a.titel }}</NuxtLink>
          </h3>
        </li>
      </ul>
    </section>

    <p class="beitrag__impressum">
      Der Dorfanzeiger · Rückt Zusammen e.V. · Baumschulenstraße 28, 50226 Frechen<br>
      Leserbriefe: <a :href="`mailto:${verein.kontakt_email}`">{{ verein.kontakt_email }}</a>
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

.beitrag__bearbeiten {
  position: fixed;
  right: clamp(1rem, 3vw, 2rem);
  bottom: clamp(1rem, 3vw, 2rem);
  z-index: 20;
  box-shadow: 0 0 0 2px var(--farbe-creme), 0 0.5rem 1.5rem rgb(0 0 0 / 0.35);
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

/* ---------- Mehr aus dem Dorfanzeiger ---------- */
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
