<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: termin } = await useTermin(slug)
if (!termin.value) {
  throw createError({ statusCode: 404, statusMessage: 'Termin nicht gefunden', fatal: true })
}

const datum = computed(() => {
  const t = termin.value!
  if (!t.beginn) return { gross: t.datum_text ?? 'Termin folgt', klein: null }
  return { gross: tagMonat(t.beginn), klein: wochentagKurz(t.beginn) }
})

const wann = computed(() => {
  const t = termin.value!
  if (!t.beginn) return t.hinweis ?? 'Datum folgt'
  const zeit = t.ende ? `${uhrzeit(t.beginn)}–${uhrzeit(t.ende)} Uhr` : `ab ${uhrzeit(t.beginn)} Uhr`
  const rhythmus = t.rhythmus_kurz ? ' · jeden ersten Montag im Monat' : ''
  return `${datumAusgeschrieben(t.beginn)} · ${zeit}${rhythmus}`
})

const seitenUrl = useRequestURL()
useSeoMeta({
  title: () => termin.value?.titel,
  description: () => termin.value?.kurzbeschreibung ?? undefined,
  ogTitle: () => termin.value?.titel,
  ogDescription: () => termin.value?.kurzbeschreibung ?? undefined,
  ogImage: () => (termin.value?.bild ? `${seitenUrl.origin}${termin.value.bild}` : undefined),
})

// strukturierte Daten für Suchmaschinen
useHead(() => ({
  script: termin.value?.beginn
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          'name': termin.value.titel,
          'startDate': termin.value.beginn,
          ...(termin.value.ende ? { endDate: termin.value.ende } : {}),
          'description': termin.value.kurzbeschreibung ?? undefined,
          'location': termin.value.ort ? { '@type': 'Place', 'name': termin.value.ort, 'address': termin.value.adresse ?? 'Königsdorf, Frechen' } : undefined,
          'organizer': { '@type': 'Organization', 'name': 'Königsdorf rückt zusammen e.V.' },
        }),
      }]
    : [],
}))
</script>

<template>
  <div v-if="termin" class="termin">
    <div class="termin__oben inhalt">
      <NuxtLink to="/#was-kommt" class="termin__zurueck handlink">← alle Termine</NuxtLink>

      <div class="termin__raster">
        <!-- links: Bild oder großer Datumszettel, Kalender -->
        <aside class="termin__seite">
          <div v-if="termin.bild" class="termin__bild">
            <BasisKlebeband position="links" farbe="gelb" :drehung="-4" />
            <NuxtImg :src="termin.bild" :alt="termin.bild_alt ?? ''" width="760" height="760" sizes="100vw md:380px" />
          </div>
          <BasisNotizzettel v-else farbe="pfirsich" radius="l" tape="mitte" :drehung="-2" class="termin__datumszettel">
            <span class="termin__datum-gross">{{ datum.gross }}</span>
            <span v-if="datum.klein" class="termin__datum-klein">{{ datum.klein }}</span>
          </BasisNotizzettel>

          <a v-if="termin.beginn && !termin.vergangen" :href="`/api/termine/${termin.slug}/kalender.ics`" class="termin__kalender" download>
            <span aria-hidden="true">+</span> In den Kalender
          </a>
        </aside>

        <!-- rechts: Titel, Fakten, Störer, Beschreibung -->
        <div class="termin__haupt">
          <p class="termin__dachzeile handschrift">{{ termin.vergangen ? 'war schön!' : 'komm vorbei!' }}</p>
          <h1 class="termin__titel">{{ termin.titel }}</h1>

          <ul class="termin__fakten strich-oben-unten">
            <li>
              <span class="termin__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
              </span>
              <span><span class="nur-screenreader">Wann: </span>{{ wann }}</span>
            </li>
            <li>
              <span class="termin__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
              </span>
              <span>
                <span class="nur-screenreader">Wo: </span>{{ termin.ort ?? 'Ort folgt' }}
                <template v-if="termin.adresse"><br><span class="termin__adresse">{{ termin.adresse }}</span></template>
              </span>
            </li>
          </ul>

          <TerminStoerer :termin="termin" class="termin__stoerer" />

          <section v-if="termin.beschreibung_html" class="termin__beschreibung" aria-labelledby="beschreibung-titel">
            <h2 id="beschreibung-titel" class="termin__abschnitt">Worum geht’s?</h2>
            <!-- eslint-disable-next-line vue/no-v-html -- serverseitig aus Markdown erzeugt, rohes HTML wird escaped -->
            <div class="termin__text" v-html="termin.beschreibung_html" />
          </section>
        </div>
      </div>
    </div>

    <TerminMitbringen v-if="termin.mitbringen_aktiv && !termin.vergangen" :termin="termin" />
  </div>
</template>

<style scoped>
.termin {
  overflow-x: clip;
}

.termin__oben {
  padding-block: clamp(2rem, 4vw, 3.5rem) var(--abstand-sektion);
}

.termin__zurueck {
  display: inline-block;
  color: var(--farbe-orange-text);
}

.termin__raster {
  display: grid;
  gap: var(--abstand-xl);
  margin-top: var(--abstand-l);
}

/* ---------- links ---------- */
.termin__seite {
  display: grid;
  gap: var(--abstand-l);
  align-content: start;
  justify-items: start;
}

.termin__bild {
  position: relative;
  width: min(100%, 23.75rem);
  padding: 0.75rem;
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-karte);
  transform: rotate(-1.5deg);
}

.termin__bild img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  object-position: top;
}

.termin__datumszettel {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 2rem 2.25rem;
}

.termin__datum-gross {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(4rem, 8vw, 6.5rem);
  line-height: 0.9;
  color: var(--farbe-orange);
}

.termin__datum-klein {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 2rem;
  color: var(--farbe-lila);
}

.termin__kalender {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.5em 1.1em;
  border: 2px solid var(--farbe-lila);
  border-radius: var(--radius-m);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-knopf-klein);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-lila);
}

.termin__kalender:hover {
  background: var(--farbe-weiss);
}

/* ---------- rechts ---------- */
.termin__haupt {
  min-width: 0;
}

.termin__dachzeile {
  margin: 0;
  color: var(--farbe-orange-text);
  transform: rotate(-2deg);
}

.termin__titel {
  margin-top: 0.3rem;
  font-size: clamp(2.75rem, 6vw, 5.25rem);
  line-height: 0.92;
  overflow-wrap: anywhere;
}

.termin__fakten {
  display: grid;
  gap: var(--abstand-s);
  margin: var(--abstand-l) 0 0;
  padding: var(--abstand-m) 0;
  list-style: none;
  font-size: var(--groesse-l);
  font-weight: var(--gewicht-text-normal);
}

.termin__fakten li {
  display: flex;
  gap: var(--abstand-s);
  align-items: center;
}

.termin__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.termin__adresse {
  font-size: var(--groesse-s);
  font-weight: var(--gewicht-text);
}

.termin__stoerer {
  margin-top: var(--abstand-xl);
}

.termin__beschreibung {
  margin-top: var(--abstand-xl);
}

.termin__abschnitt {
  font-size: var(--groesse-h3);
}

.termin__text {
  max-width: 40rem;
  margin-top: var(--abstand-s);
  font-size: var(--groesse-l);
  line-height: 1.7;
}

.termin__text :deep(p),
.termin__text :deep(ul) {
  margin: 0 0 1em;
}

.termin__text :deep(a) {
  color: var(--farbe-lila);
  text-decoration-color: var(--farbe-orange);
}

@media (min-width: 56rem) {
  .termin__raster {
    grid-template-columns: minmax(0, 23.75rem) minmax(0, 1fr);
    gap: clamp(2.5rem, 6vw, 6rem);
  }

  .termin__seite {
    position: sticky;
    top: 6.5rem;
  }
}
</style>
