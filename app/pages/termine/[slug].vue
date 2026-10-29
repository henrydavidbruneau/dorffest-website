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
  if (t.uhrzeit_folgt) return `${new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', year: 'numeric' }).format(new Date(t.beginn))} · Uhrzeit folgt`
  const zeit = t.ende ? `${uhrzeit(t.beginn)}–${uhrzeit(t.ende)} Uhr` : `ab ${uhrzeit(t.beginn)} Uhr`
  // regelmäßig: „Jeden ersten Montag im Monat · ab 19:00 Uhr“ (der Zettel zeigt das nächste Datum)
  if (t.wiederholung_text) return `${t.wiederholung_text[0]!.toUpperCase()}${t.wiederholung_text.slice(1)} · ${zeit}`
  // Datum steht schon groß auf dem Zettel – hier Wochentag + Uhrzeit
  const wochentag = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long' }).format(new Date(t.beginn))
  return `${wochentag} · ${zeit}`
})

// zurück aus dem Austragen-Link der Anmeldebestätigung
const ausgetragen = computed(() => route.query.ausgetragen === '1')

const seitenUrl = useRequestURL()
const kalender = computed(() => kalenderLinks(termin.value!, seitenUrl.origin))
useSeoMeta({
  title: () => termin.value?.titel,
  description: () => termin.value?.kurzbeschreibung ?? undefined,
  ogTitle: () => termin.value?.titel,
  ogDescription: () => termin.value?.kurzbeschreibung ?? undefined,
  ogImage: () => (termin.value?.bild ? `${seitenUrl.origin}${bildUrl(termin.value.bild)}` : undefined),
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
    <!-- Kopfband wie ein Veranstaltungsplakat -->
    <header class="plakat">
      <div class="plakat__inhalt inhalt">
        <NuxtLink to="/#was-kommt" class="plakat__zurueck handlink">← alle Termine</NuxtLink>

        <div class="plakat__raster">
          <div class="plakat__text">
            <p class="plakat__zusatz handschrift">{{ termin.vergangen ? 'war schön!' : 'komm vorbei!' }}</p>
            <h1 class="plakat__titel">{{ termin.titel }}</h1>

            <div class="plakat__wann">
              <BasisNotizzettel farbe="pfirsich" radius="l" :drehung="-3" class="plakat__datum">
                <span class="plakat__datum-gross">{{ datum.gross }}</span>
                <span v-if="datum.klein" class="plakat__datum-klein">{{ datum.klein }}</span>
              </BasisNotizzettel>
              <ul class="plakat__fakten">
                <li><span class="nur-screenreader">Wann: </span>{{ wann }}</li>
                <li>
                  <span class="nur-screenreader">Wo: </span>{{ termin.ort ?? 'Ort folgt' }}<template v-if="termin.adresse">, {{ termin.adresse }}</template>
                </li>
              </ul>
            </div>

            <p v-if="ausgetragen" class="plakat__hinweis" role="status">
              Du bist ausgetragen, dein Platz ist wieder frei. Schade – vielleicht beim nächsten Mal!
            </p>

            <div class="plakat__knoepfe">
              <BasisKnopf v-if="termin.anmeldung_aktiv && !termin.vergangen" to="#anmeldung" variante="hell">Anmelden</BasisKnopf>
              <BasisKnopf v-if="termin.wunschliste_aktiv && !termin.vergangen" to="#wunschliste" variante="hell">Mitbestimmen</BasisKnopf>
              <details v-if="kalender.ics && !termin.vergangen" class="kalender">
                <summary class="plakat__kalender"><span aria-hidden="true">+</span> Zum Kalender hinzufügen</summary>
                <ul class="kalender__liste">
                  <li><a :href="kalender.google!" target="_blank" rel="noopener">Google Kalender</a></li>
                  <li><a :href="kalender.outlook!" target="_blank" rel="noopener">Outlook</a></li>
                  <li><a :href="kalender.ics" download>Apple / andere (.ics)</a></li>
                </ul>
              </details>
            </div>
          </div>

          <div class="plakat__bild">
            <BasisPolaroid
              v-if="termin.bild"
              :src="termin.bild"
              :alt="termin.bild_alt ?? ''"
              :breite="760"
              :hoehe="760"
              :drehung="3"
              tape="mitte"
              class="plakat__polaroid"
            />
            <img v-else src="/illustrationen/disco.svg" alt="" width="700" height="1080" class="plakat__illustration">
            <TerminSticker :termin="termin" class="plakat__sticker" />
          </div>
        </div>
      </div>
    </header>

    <!-- Lesespalte -->
    <div class="termin__spalte">
      <section v-if="termin.beschreibung_html" class="termin__beschreibung" aria-labelledby="beschreibung-titel">
        <h2 id="beschreibung-titel" class="termin__abschnitt">Worum geht’s?</h2>
        <!-- eslint-disable-next-line vue/no-v-html -- serverseitig aus Markdown erzeugt, rohes HTML wird escaped -->
        <div class="termin__text" v-html="termin.beschreibung_html" />
      </section>

      <TerminWunschliste v-if="termin.wunschliste_aktiv" :termin="termin" class="termin__wunschliste" />

      <TerminStoerer :termin="termin" class="termin__anmeldung" />
    </div>

  </div>
</template>

<style scoped>
.termin {
  overflow-x: clip;
}

/* ---------- Kopfband ---------- */
.plakat {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.plakat__inhalt {
  padding-block: clamp(1.75rem, 3.5vw, 3rem) clamp(3rem, 6vw, 5.5rem);
}

.plakat__zurueck {
  display: inline-block;
  color: var(--farbe-pfirsich);
}

.plakat__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
  margin-top: var(--abstand-l);
}

.plakat__zusatz {
  margin: 0;
  color: var(--farbe-orange);
  transform: rotate(-3deg);
  transform-origin: left;
}

.plakat__titel {
  margin-top: 0.3rem;
  font-size: clamp(2.75rem, 6.6vw, 6.25rem);
  line-height: 0.88;
  color: var(--farbe-pfirsich);
  overflow-wrap: anywhere;
}

.plakat__wann {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-m) var(--abstand-l);
  align-items: center;
  margin-top: var(--abstand-l);
}

.plakat__datum {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 1rem 1.4rem 0.9rem;
  color: var(--farbe-schwarz);
}

.plakat__datum-gross {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(2.75rem, 5vw, 4.5rem);
  line-height: 0.9;
  color: var(--farbe-orange);
}

.plakat__datum-klein {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  color: var(--farbe-lila);
}

.plakat__fakten {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.125rem, 1.6vw, 1.4rem);
  line-height: 1.2;
  text-transform: uppercase;
}

.plakat__hinweis {
  margin: var(--abstand-s) 0 0;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-m, 0.6rem);
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
  font-weight: var(--gewicht-text-mittel);
}

.plakat__knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-top: var(--abstand-l);
}

.plakat__kalender {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  min-height: clamp(2.75rem, 3.68vw, 3.3125rem);
  padding: 0.55em 1em;
  border: 2px solid var(--farbe-pfirsich);
  border-radius: var(--radius-m);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-knopf);
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-pfirsich);
}

.plakat__kalender:hover {
  background: rgb(255 255 255 / 0.08);
}

/* „Zum Kalender hinzufügen“: kleines Menü mit Google, Outlook, .ics */
.kalender {
  position: relative;
}

.kalender summary {
  cursor: pointer;
  list-style: none;
}

.kalender summary::-webkit-details-marker {
  display: none;
}

.kalender[open] summary {
  background: rgb(255 255 255 / 0.08);
}

.kalender__liste {
  position: absolute;
  z-index: 5;
  top: calc(100% + 0.4rem);
  left: 0;
  min-width: 100%;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: var(--radius-m);
  background: var(--farbe-creme);
  box-shadow: 0 0.6rem 1.6rem rgb(0 0 0 / 0.25);
}

.kalender__liste a {
  display: block;
  padding: 0.55rem 0.8rem;
  border-radius: 0.4rem;
  color: var(--farbe-lila);
  font-weight: var(--gewicht-text-mittel);
  text-decoration: none;
  white-space: nowrap;
}

.kalender__liste a:hover,
.kalender__liste a:focus-visible {
  background: var(--farbe-pfirsich);
}

.plakat__bild {
  position: relative;
  justify-self: center;
  width: min(100%, 24rem);
}

.plakat__polaroid {
  width: 100%;
}

.plakat__polaroid :deep(.polaroid__bild) {
  aspect-ratio: 1;
  object-position: top;
}

.plakat__illustration {
  width: min(70%, 13rem);
  margin-inline: auto;
}

.plakat__sticker {
  position: absolute;
  bottom: -1.5rem;
  left: -2rem;
}

/* ---------- Lesespalte ---------- */
.termin__spalte {
  max-width: calc(44rem + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-xl) var(--seitenrand) var(--abstand-sektion);
}

.termin__abschnitt {
  font-size: var(--groesse-h3);
}

.termin__text {
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

.termin__anmeldung,
.termin__wunschliste {
  margin-top: var(--abstand-xl);
}

@media (min-width: 56rem) {
  .plakat__raster {
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
    gap: clamp(2.5rem, 6vw, 6rem);
  }
}

@media (max-width: 55.99rem) {
  .plakat__bild {
    width: min(80%, 20rem);
  }

  .plakat__sticker {
    left: -1rem;
  }
}
</style>
